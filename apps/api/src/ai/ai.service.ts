import { Injectable, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  private getConfig() {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
    const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY tanımlı değil. apps/api/.env dosyasına ekleyin.');
    }
    return { apiKey, model, baseUrl };
  }

  private async callOpenAI(messages: ChatMsg[], opts: { temperature?: number; jsonMode?: boolean; maxTokens?: number } = {}) {
    const { apiKey, model, baseUrl } = this.getConfig();
    const body: any = {
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
    };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    if (opts.jsonMode) body.response_format = { type: 'json_object' };

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      throw new InternalServerErrorException(`OpenAI bağlantı hatası: ${err.message}`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new InternalServerErrorException(`OpenAI hata (${res.status}): ${errText.slice(0, 300)}`);
    }
    const data: any = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return content;
  }

  // ── Chat with lesson/module context ─────────────────────────────────
  async chat(userId: string, dto: ChatDto) {
    let systemContext = '';

    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
        include: { module: { include: { course: true } } },
      });
      if (!lesson) throw new NotFoundException('Ders bulunamadı');
      systemContext = `Bu konuşma EduCell platformundaki "${lesson.module.course.title}" kursunun "${lesson.module.title}" modülünün "${lesson.title}" dersi hakkında.

Ders içeriği:
${lesson.content}

Öğrenciye bu konuda yardımcı ol. Türkçe, samimi ve eğitici bir dille yanıtla. Sadece bu konuyla ilgili soruları yanıtla, konu dışına çıkma. Cevapların kısa ve net olsun (en fazla 3-4 paragraf).`;
    } else if (dto.moduleId) {
      const mod = await this.prisma.module.findUnique({
        where: { id: dto.moduleId },
        include: { course: true, lessons: { orderBy: { orderIndex: 'asc' } } },
      });
      if (!mod) throw new NotFoundException('Modül bulunamadı');
      const lessonTitles = mod.lessons.map((l, i) => `${i + 1}. ${l.title}`).join('\n');
      systemContext = `Bu konuşma EduCell platformundaki "${mod.course.title}" kursunun "${mod.title}" modülü hakkında.

Modül açıklaması: ${mod.description ?? ''}

Modüldeki dersler:
${lessonTitles}

Öğrenciye bu modülün konuları hakkında yardımcı ol. Türkçe, samimi ve eğitici bir dille yanıtla. Cevapların kısa ve net olsun.`;
    } else {
      systemContext = 'Sen EduCell eğitim platformunda öğrencilere yardımcı olan bir asistanın. Türkçe yanıtla, kısa ve net ol.';
    }

    const messages: ChatMsg[] = [
      { role: 'system', content: systemContext },
      ...dto.messages.map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
    ];

    const reply = await this.callOpenAI(messages, { temperature: 0.7, maxTokens: 800 });
    return { reply };
  }

  // ── Auto-generate quiz questions for module ─────────────────────────
  async generateQuestions(instructorId: string, dto: GenerateQuestionsDto) {
    const mod = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
      include: {
        course: true,
        lessons: { orderBy: { orderIndex: 'asc' } },
        exam: true,
      },
    });
    if (!mod) throw new NotFoundException('Modül bulunamadı');
    if (mod.course.instructorId !== instructorId) throw new ForbiddenException('Yetkiniz yok');
    if (!mod.exam) throw new BadRequestException('Önce modül için sınav oluştur');

    const count = Math.min(Math.max(dto.count ?? 5, 1), 15);
    const lessonContext = mod.lessons.map((l, i) =>
      `--- Ders ${i + 1}: ${l.title} ---\n${(l.content ?? '').slice(0, 1200)}`,
    ).join('\n\n');

    const systemPrompt = `Sen eğitim sınavı oluşturan bir asistansın. Verilen modül başlığı, açıklaması ve ders içeriklerine göre Türkçe çoktan seçmeli sorular üretirsin. Cevabını SADECE geçerli JSON olarak ver, başka metin yazma.

JSON şeması:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "MULTI_SELECT" | "TRUE_FALSE",
      "text": "Soru metni",
      "options": [
        { "id": "a", "text": "Seçenek metni", "isCorrect": true | false }
      ]
    }
  ]
}

Kurallar:
- MULTIPLE_CHOICE: tam 4 seçenek, SADECE 1 tanesi doğru
- MULTI_SELECT: tam 4 seçenek, 2 veya 3 tanesi doğru
- TRUE_FALSE: tam 2 seçenek (id "true" ve "false"), text "Doğru" ve "Yanlış"
- Sorular eğitim konusuyla doğrudan ilgili olsun
- Karışık tipler kullan (en az 1 TRUE_FALSE, en az 1 MULTI_SELECT)
- Seçenek id'leri "a", "b", "c", "d" (TRUE_FALSE için "true", "false")
- Sadece JSON döndür, markdown bloğu kullanma`;

    const userPrompt = `Kurs: ${mod.course.title}
Modül: ${mod.title}
Açıklama: ${mod.description ?? ''}

${lessonContext}

Bu modül için ${count} adet sınav sorusu üret. Sadece JSON döndür.`;

    const raw = await this.callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.6, jsonMode: true, maxTokens: 2500 },
    );

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new InternalServerErrorException('AI geçerli JSON döndürmedi');
      parsed = JSON.parse(m[0]);
    }
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (questions.length === 0) throw new InternalServerErrorException('AI hiç soru üretmedi');

    // Save to DB
    const existingCount = await this.prisma.question.count({ where: { examId: mod.exam.id } });
    const created: any[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.type || !q.text || !Array.isArray(q.options)) continue;
      // Normalize options
      const opts = q.options.map((o: any, idx: number) => ({
        id: String(o.id ?? String.fromCharCode(97 + idx)),
        text: String(o.text ?? ''),
        isCorrect: !!o.isCorrect,
      }));
      const saved = await this.prisma.question.create({
        data: {
          examId: mod.exam.id,
          type: q.type,
          text: String(q.text),
          options: opts as any,
          orderIndex: existingCount + i + 1,
        },
      });
      created.push(saved);
    }
    return { created: created.length, questions: created };
  }
}
