import { PrismaClient, Role, Level, CourseStatus, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Wipe
  await prisma.userAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();

  const hash = async (p: string) => bcrypt.hash(p, 10);

  // Users — upsert (varsa dokunma)
  const instructor = await prisma.user.upsert({
    where: { gsm: '05551112233' },
    update: {},
    create: {
      gsm: '05551112233',
      passwordHash: await hash('Test1234'),
      name: 'Ahmet Yılmaz',
      role: Role.INSTRUCTOR,
      bio: 'Yazılım mühendisi, 10 yıl tecrübe',
      meta: { expertise: ['JavaScript', 'React', 'Node.js'] },
    },
  });

  await prisma.user.upsert({
    where: { gsm: '05554445566' },
    update: {},
    create: {
      gsm: '05554445566',
      passwordHash: await hash('Test1234'),
      name: 'Fatma Kaya',
      role: Role.STUDENT,
      meta: { interests: ['web', 'mobile'] },
    },
  });

  await prisma.user.upsert({
    where: { gsm: '05557778899' },
    update: {},
    create: {
      gsm: '05557778899',
      passwordHash: await hash('Test1234'),
      name: 'Admin Kullanıcı',
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { gsm: '05550000000' },
    update: {},
    create: {
      gsm: '05550000000',
      passwordHash: await hash('Bera1234'),
      name: 'Bera',
      role: Role.STUDENT,
    },
  });

  const coursesData = [
    {
      title: 'JavaScript Temelleri',
      description: 'Sıfırdan JavaScript öğrenin. Değişkenler, fonksiyonlar, DOM manipülasyonu ve modern ES6+ özellikleri.',
      category: 'Programlama',
      level: Level.BEGINNER,
      estimatedDuration: 600,
      modules: [
        {
          title: 'Temel Kavramlar',
          description: 'Değişkenler, veri tipleri ve operatörler',
          lessons: [
            { title: 'JavaScript Nedir?', content: 'JavaScript, web tarayıcılarında çalışan dinamik bir programlama dilidir. 1995 yılında Brendan Eich tarafından geliştirilmiştir.\n\nJavaScript ile:\n- Web sayfalarını etkileşimli hale getirebilirsiniz\n- Form doğrulama yapabilirsiniz\n- Animasyonlar oluşturabilirsiniz\n- API\'lerle iletişim kurabilirsiniz\n\nÖrnek kod:\n```javascript\nconsole.log("Merhaba Dünya!");\n```', estimatedDuration: 15 },
            { title: 'Değişkenler ve Veri Tipleri', content: 'JavaScript\'te değişken tanımlamak için let, const ve var anahtar kelimeleri kullanılır.\n\nlet: Değeri değiştirilebilen değişken\nconst: Değeri değiştirilemeyen sabit\nvar: Eski yöntem, kullanımı önerilmez\n\nVeri tipleri:\n- string: Metin\n- number: Sayı\n- boolean: true/false\n- null: Boş değer\n- undefined: Tanımsız\n- object: Nesne\n- array: Dizi', estimatedDuration: 20 },
            { title: 'Fonksiyonlar', content: 'Fonksiyonlar, belirli bir işlemi gerçekleştiren kod bloklarıdır.\n\nGeleneksel fonksiyon:\n```javascript\nfunction topla(a, b) {\n  return a + b;\n}\n```\n\nOk fonksiyonu (Arrow Function):\n```javascript\nconst topla = (a, b) => a + b;\n```\n\nFonksiyonlar parametreler alabilir ve değer döndürebilir.', estimatedDuration: 25 },
          ],
          exam: { timeLimitMin: 10, passingScore: 60 },
        },
        {
          title: 'DOM Manipülasyonu',
          description: 'HTML elementlerini JavaScript ile yönetme',
          lessons: [
            { title: 'DOM Nedir?', content: 'DOM (Document Object Model), HTML belgesinin ağaç yapısında temsilidir.\n\nJavaScript ile DOM\'u manipüle etmek için:\n- document.getElementById(): ID ile element seçme\n- document.querySelector(): CSS seçici ile element seçme\n- document.querySelectorAll(): Tüm eşleşen elementleri seçme', estimatedDuration: 20 },
            { title: 'Event Listener\'lar', content: 'Kullanıcı etkileşimlerini yakalamak için event listener kullanırız.\n\n```javascript\nbutton.addEventListener("click", function() {\n  alert("Butona tıklandı!");\n});\n```\n\nYaygın event\'ler:\n- click: Tıklama\n- mouseover: Fare üzerine gelme\n- keydown: Tuş basma\n- submit: Form gönderme', estimatedDuration: 20 },
            { title: 'Asenkron JavaScript', content: 'JavaScript asenkron işlemleri Promise ve async/await ile yönetir.\n\n```javascript\nasync function veriGetir() {\n  try {\n    const yanit = await fetch("https://api.example.com/data");\n    const veri = await yanit.json();\n    console.log(veri);\n  } catch (hata) {\n    console.error(hata);\n  }\n}\n```', estimatedDuration: 30 },
          ],
          exam: { timeLimitMin: 10, passingScore: 60 },
        },
        {
          title: 'Modern JavaScript (ES6+)',
          description: 'Destructuring, spread, modules ve daha fazlası',
          lessons: [
            { title: 'Destructuring ve Spread', content: 'ES6 ile gelen yıkım ataması ve yayma operatörü.\n\nDestructuring:\n```javascript\nconst { ad, yas } = kullanici;\nconst [birinci, ikinci] = dizi;\n```\n\nSpread:\n```javascript\nconst yeniDizi = [...eski, yeniEleman];\nconst yeniNesne = { ...eski, yeniAlan: deger };\n```', estimatedDuration: 25 },
            { title: 'Modüller', content: 'JavaScript modülleri, kodu organize etmek için kullanılır.\n\nExport:\n```javascript\nexport const PI = 3.14;\nexport function hesapla() {}\nexport default class Hesaplama {}\n```\n\nImport:\n```javascript\nimport Hesaplama from "./hesaplama";\nimport { PI, hesapla } from "./matematik";\n```', estimatedDuration: 20 },
            { title: 'Array Metodları', content: 'Modern JavaScript\'in güçlü dizi metodları:\n\n- map(): Her elemanı dönüştür\n- filter(): Koşula uyan elemanları filtrele\n- reduce(): Diziyi tek değere indirge\n- find(): İlk eşleşeni bul\n- some()/every(): Koşul kontrolü\n\n```javascript\nconst kareler = sayilar.map(n => n * n);\nconst ciftler = sayilar.filter(n => n % 2 === 0);\nconst toplam = sayilar.reduce((acc, n) => acc + n, 0);\n```', estimatedDuration: 25 },
          ],
          exam: { timeLimitMin: 10, passingScore: 60 },
        },
      ],
    },
    {
      title: 'React ile Modern Web',
      description: 'Component tabanlı mimari, hooks, state yönetimi ve modern React geliştirme pratikleri.',
      category: 'Frontend',
      level: Level.INTERMEDIATE,
      estimatedDuration: 900,
      modules: [
        {
          title: 'React Temelleri',
          description: 'JSX, componentler ve props',
          lessons: [
            { title: 'React Nedir?', content: 'React, Facebook tarafından geliştirilen bir UI kütüphanesidir. Component tabanlı mimari kullanır.\n\nTemel kavramlar:\n- Component: Yeniden kullanılabilir UI parçaları\n- JSX: JavaScript içinde HTML benzeri syntax\n- Virtual DOM: Performanslı DOM güncellemeleri', estimatedDuration: 20 },
            { title: 'JSX ve Components', content: 'JSX, JavaScript içinde HTML yazmanızı sağlar.\n\n```jsx\nfunction Karsilama({ ad }) {\n  return (\n    <div className="karsilama">\n      <h1>Merhaba, {ad}!</h1>\n    </div>\n  );\n}\n```\n\nComponent isimleri büyük harfle başlamalıdır.', estimatedDuration: 25 },
            { title: 'Props ve State', content: 'Props parent\'tan child\'a veri aktarımını sağlar.\nState component\'in kendi iç durumudur.\n\n```jsx\nfunction Sayac() {\n  const [sayi, setSayi] = useState(0);\n  \n  return (\n    <button onClick={() => setSayi(sayi + 1)}>\n      Tıklandı: {sayi}\n    </button>\n  );\n}\n```', estimatedDuration: 30 },
          ],
          exam: { timeLimitMin: 10, passingScore: 65 },
        },
        {
          title: 'React Hooks',
          description: 'useState, useEffect ve custom hooks',
          lessons: [
            { title: 'useState Hook', content: 'useState, fonksiyonel componentlerde state yönetimini sağlar.\n\n```jsx\nconst [deger, setDeger] = useState(baslangicDegeri);\n```\n\nState güncellemesi asenkrondur. Önceki state\'e bağlı güncellemeler için fonksiyon kullanın:\n```jsx\nsetSayi(prev => prev + 1);\n```', estimatedDuration: 25 },
            { title: 'useEffect Hook', content: 'useEffect, yan etkileri yönetmek için kullanılır.\n\n```jsx\nuseEffect(() => {\n  // Component mount/update\'de çalışır\n  fetch("/api/data").then(...);\n  \n  return () => {\n    // Cleanup: component unmount\'ta çalışır\n  };\n}, [bagimlilik]); // Boş array = sadece mount\'ta\n```', estimatedDuration: 30 },
            { title: 'Custom Hooks', content: 'Custom hooks, state mantığını yeniden kullanmanızı sağlar.\n\n```jsx\nfunction useLocalStorage(key, baslangic) {\n  const [deger, setDeger] = useState(\n    () => JSON.parse(localStorage.getItem(key)) ?? baslangic\n  );\n  \n  const kaydet = (yeni) => {\n    setDeger(yeni);\n    localStorage.setItem(key, JSON.stringify(yeni));\n  };\n  \n  return [deger, kaydet];\n}\n```', estimatedDuration: 25 },
          ],
          exam: { timeLimitMin: 10, passingScore: 65 },
        },
        {
          title: 'React Router ve State Yönetimi',
          description: 'Sayfa yönlendirme ve global state',
          lessons: [
            { title: 'React Router', content: 'React Router ile çok sayfalı uygulamalar oluşturun.\n\n```jsx\nimport { BrowserRouter, Routes, Route, Link } from "react-router-dom";\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path="/" element={<Anasayfa />} />\n        <Route path="/hakkimda" element={<Hakkimda />} />\n        <Route path="/urun/:id" element={<UrunDetay />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}\n```', estimatedDuration: 30 },
            { title: 'Context API', content: 'Context API global state yönetimi için kullanılır.\n\n```jsx\nconst AuthContext = createContext();\n\nfunction AuthProvider({ children }) {\n  const [kullanici, setKullanici] = useState(null);\n  return (\n    <AuthContext.Provider value={{ kullanici, setKullanici }}>\n      {children}\n    </AuthContext.Provider>\n  );\n}\n\nfunction ProfilButonu() {\n  const { kullanici } = useContext(AuthContext);\n  return <span>{kullanici?.ad}</span>;\n}\n```', estimatedDuration: 25 },
            { title: 'Performans Optimizasyonu', content: 'React uygulamalarını hızlandırma teknikleri:\n\n- memo(): Gereksiz re-render\'ları önle\n- useMemo(): Pahalı hesaplamaları cache\'le\n- useCallback(): Fonksiyon referanslarını sabitle\n- lazy/Suspense: Kod bölme (code splitting)\n\n```jsx\nconst AgirComponent = memo(({ veri }) => {\n  const sonuc = useMemo(() => agirHesaplama(veri), [veri]);\n  return <div>{sonuc}</div>;\n});\n```', estimatedDuration: 25 },
          ],
          exam: { timeLimitMin: 10, passingScore: 65 },
        },
      ],
    },
    {
      title: 'Sistem Tasarımı',
      description: 'Ölçeklenebilir sistemler nasıl tasarlanır? Microservices, veritabanı tasarımı, cache ve dağıtık sistemler.',
      category: 'Mimari',
      level: Level.ADVANCED,
      estimatedDuration: 1200,
      modules: [
        {
          title: 'Temel Kavramlar',
          description: 'Ölçeklenebilirlik, güvenilirlik ve performans',
          lessons: [
            { title: 'Sistem Tasarımına Giriş', content: 'Sistem tasarımı, büyük ölçekli yazılım sistemlerinin mimarisini planlamaktır.\n\nTemel prensipler:\n- Ölçeklenebilirlik: Artan yük altında performans\n- Güvenilirlik: Hata toleransı ve yüksek erişilebilirlik\n- Sürdürülebilirlik: Kolay bakım ve geliştirme\n- Verimlilik: Kaynak kullanımı optimizasyonu', estimatedDuration: 30 },
            { title: 'Yük Dengeleme', content: 'Load balancer, gelen trafiği birden fazla sunucuya dağıtır.\n\nAlgoritmalalar:\n- Round Robin: Sırayla dağıtım\n- Least Connections: En az bağlantılı sunucu\n- IP Hash: Aynı IP = aynı sunucu (session persistency)\n- Weighted Round Robin: Sunucu kapasitesine göre\n\nL4 vs L7 Load Balancer arasındaki fark ve kullanım senaryoları.', estimatedDuration: 35 },
            { title: 'Önbellek (Cache)', content: 'Cache, sık erişilen verileri hızlı depolamada tutar.\n\nCache stratejileri:\n- Cache-Aside: Uygulama cache\'i yönetir\n- Write-Through: Yazma hem cache hem DB\'ye\n- Write-Behind: Önce cache, sonra DB\n- Read-Through: Cache okumayı yönetir\n\nRedis kullanım senaryoları:\n- Session storage\n- Rate limiting\n- Pub/Sub messaging\n- Leaderboard', estimatedDuration: 35 },
          ],
          exam: { timeLimitMin: 15, passingScore: 70 },
        },
        {
          title: 'Veritabanı Tasarımı',
          description: 'SQL, NoSQL ve veritabanı seçim kriterleri',
          lessons: [
            { title: 'SQL vs NoSQL', content: 'SQL (İlişkisel):\n- Yapılandırılmış veri\n- ACID uyumu\n- Güçlü tutarlılık\n- Örnekler: PostgreSQL, MySQL\n\nNoSQL:\n- Esnek şema\n- Yatay ölçekleme\n- Farklı tipler: Document, Key-Value, Column, Graph\n- Örnekler: MongoDB, Redis, Cassandra, Neo4j\n\nSeçim kriterleri: Veri yapısı, ölçekleme ihtiyacı, tutarlılık gereklilikleri', estimatedDuration: 40 },
            { title: 'Veritabanı İndeksleme', content: 'İndeksler sorgu performansını artırır.\n\nİndeks tipleri:\n- B-Tree: Genel amaçlı, sıralı veri\n- Hash: Eşitlik sorguları\n- GiST: Geometrik ve metin verileri\n- Partial: Belirli satırlar için\n\nİndeks tasarım prensipleri:\n- Sık sorgulanan kolonlar\n- WHERE, JOIN, ORDER BY kolonları\n- Kardinalite (benzersizlik) dikkate alınmalı\n- Aşırı indeks yazma performansını düşürür', estimatedDuration: 35 },
            { title: 'Veritabanı Ölçekleme', content: 'Veritabanı ölçekleme stratejileri:\n\nVertical Scaling: Daha güçlü donanım\nHorizontal Scaling:\n- Read Replicas: Okuma yükünü dağıtma\n- Sharding: Verileri parçalara bölme\n  - Range-based: ID aralığına göre\n  - Hash-based: Hash fonksiyonuna göre\n  - Directory-based: Merkezi lookup tablosu\n\nCAP Teoremi: Consistency, Availability, Partition Tolerance - ikisini seç', estimatedDuration: 40 },
          ],
          exam: { timeLimitMin: 15, passingScore: 70 },
        },
        {
          title: 'Mikroservis Mimarisi',
          description: 'Servislerin ayrıştırılması ve iletişim',
          lessons: [
            { title: 'Microservices vs Monolith', content: 'Monolitik:\n+ Basit geliştirme ve deploy\n+ Düşük latency (process içi çağrı)\n- Ölçekleme zorluğu\n- Teknoloji kilitlenmesi\n- Büyük ekiplerde coordination sorunu\n\nMicroservices:\n+ Bağımsız ölçekleme\n+ Teknoloji çeşitliliği\n+ Küçük, odaklı ekipler\n- Dağıtık sistem karmaşıklığı\n- Network latency\n- Veri tutarlılığı zorluğu', estimatedDuration: 35 },
            { title: 'API Gateway', content: 'API Gateway, microservice mimarisinde tek giriş noktasıdır.\n\nGörevleri:\n- Routing: İstekleri ilgili servise yönlendirme\n- Authentication: Merkezi kimlik doğrulama\n- Rate Limiting: İstek sınırlama\n- Load Balancing: Yük dağılımı\n- SSL Termination: HTTPS işleme\n- Request/Response Transformation\n\nÖrnekler: AWS API Gateway, Kong, Nginx', estimatedDuration: 30 },
            { title: 'Event-Driven Mimari', content: 'Event-driven mimari, servisler arasında asenkron iletişim sağlar.\n\nMessage Queue (Kafka, RabbitMQ):\n- Producer → Topic/Queue → Consumer\n- Asenkron, decoupled iletişim\n- Yüksek throughput\n\nEvent Sourcing:\n- State yerine event\'leri sakla\n- Audit log, time travel debugging\n\nSAGA Pattern:\n- Dağıtık transaction yönetimi\n- Choreography vs Orchestration', estimatedDuration: 40 },
          ],
          exam: { timeLimitMin: 15, passingScore: 70 },
        },
      ],
    },
  ];

  const questionBank = (examId: string, moduleIndex: number, courseIndex: number) => {
    const baseQuestions = [
      {
        examId,
        type: QuestionType.MULTIPLE_CHOICE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: Aşağıdakilerden hangisi doğrudur?`,
        options: [
          { id: 'a', text: 'Birinci seçenek', isCorrect: true },
          { id: 'b', text: 'İkinci seçenek', isCorrect: false },
          { id: 'c', text: 'Üçüncü seçenek', isCorrect: false },
          { id: 'd', text: 'Dördüncü seçenek', isCorrect: false },
        ],
        orderIndex: 1,
      },
      {
        examId,
        type: QuestionType.MULTIPLE_CHOICE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: En iyi pratik hangisidir?`,
        options: [
          { id: 'a', text: 'Doğru yaklaşım', isCorrect: true },
          { id: 'b', text: 'Yanlış yaklaşım A', isCorrect: false },
          { id: 'c', text: 'Yanlış yaklaşım B', isCorrect: false },
          { id: 'd', text: 'Geçersiz seçenek', isCorrect: false },
        ],
        orderIndex: 2,
      },
      {
        examId,
        type: QuestionType.TRUE_FALSE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: Bu ifade doğru mudur? "Bu modülün konusu önemlidir."`,
        options: [
          { id: 'true', text: 'Doğru', isCorrect: true },
          { id: 'false', text: 'Yanlış', isCorrect: false },
        ],
        orderIndex: 3,
      },
      {
        examId,
        type: QuestionType.TRUE_FALSE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: "Kod tekrarı azaltmak iyi bir pratiktir" doğru mu?`,
        options: [
          { id: 'true', text: 'Doğru', isCorrect: true },
          { id: 'false', text: 'Yanlış', isCorrect: false },
        ],
        orderIndex: 4,
      },
      {
        examId,
        type: QuestionType.MULTI_SELECT,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: Hangiler bu konunun avantajları arasındadır? (Birden fazla seçin)`,
        options: [
          { id: 'a', text: 'Ölçeklenebilirlik', isCorrect: true },
          { id: 'b', text: 'Yavaşlık', isCorrect: false },
          { id: 'c', text: 'Okunabilirlik', isCorrect: true },
          { id: 'd', text: 'Güvenilirlik', isCorrect: true },
        ],
        orderIndex: 5,
      },
      {
        examId,
        type: QuestionType.MULTIPLE_CHOICE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: Hangisi doğru bir kullanımdır?`,
        options: [
          { id: 'a', text: 'Doğru kullanım', isCorrect: true },
          { id: 'b', text: 'Yanlış kullanım B', isCorrect: false },
          { id: 'c', text: 'Yanlış kullanım C', isCorrect: false },
          { id: 'd', text: 'Yanlış kullanım D', isCorrect: false },
        ],
        orderIndex: 6,
      },
      {
        examId,
        type: QuestionType.TRUE_FALSE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: "Bu teknik performansı artırır" ifadesi doğru mudur?`,
        options: [
          { id: 'true', text: 'Doğru', isCorrect: true },
          { id: 'false', text: 'Yanlış', isCorrect: false },
        ],
        orderIndex: 7,
      },
      {
        examId,
        type: QuestionType.MULTI_SELECT,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: Dikkat edilmesi gereken noktalar hangileridir?`,
        options: [
          { id: 'a', text: 'Nokta A', isCorrect: true },
          { id: 'b', text: 'Nokta B (yanlış)', isCorrect: false },
          { id: 'c', text: 'Nokta C', isCorrect: true },
          { id: 'd', text: 'Nokta D', isCorrect: true },
        ],
        orderIndex: 8,
      },
      {
        examId,
        type: QuestionType.MULTIPLE_CHOICE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: Doğru cevap hangisidir?`,
        options: [
          { id: 'a', text: 'Doğru seçenek', isCorrect: true },
          { id: 'b', text: 'Seçenek B', isCorrect: false },
          { id: 'c', text: 'Seçenek C', isCorrect: false },
          { id: 'd', text: 'Seçenek D', isCorrect: false },
        ],
        orderIndex: 9,
      },
      {
        examId,
        type: QuestionType.TRUE_FALSE,
        text: `${courseIndex + 1}. kurs, ${moduleIndex + 1}. modül: "Bu modülü geçmek için %60 puan yeterlidir" doğru mu?`,
        options: [
          { id: 'true', text: 'Doğru', isCorrect: true },
          { id: 'false', text: 'Yanlış', isCorrect: false },
        ],
        orderIndex: 10,
      },
    ];
    return baseQuestions;
  };

  for (let ci = 0; ci < coursesData.length; ci++) {
    const cd = coursesData[ci];
    const course = await prisma.course.create({
      data: {
        title: cd.title,
        description: cd.description,
        category: cd.category,
        level: cd.level as Level,
        estimatedDuration: cd.estimatedDuration,
        status: CourseStatus.PUBLISHED,
        instructorId: instructor.id,
      },
    });

    for (let mi = 0; mi < cd.modules.length; mi++) {
      const md = cd.modules[mi];
      const mod = await prisma.module.create({
        data: {
          title: md.title,
          description: md.description,
          orderIndex: mi + 1,
          courseId: course.id,
        },
      });

      for (let li = 0; li < md.lessons.length; li++) {
        await prisma.lesson.create({
          data: {
            title: md.lessons[li].title,
            content: md.lessons[li].content,
            estimatedDuration: md.lessons[li].estimatedDuration,
            orderIndex: li + 1,
            moduleId: mod.id,
          },
        });
      }

      const exam = await prisma.exam.create({
        data: {
          moduleId: mod.id,
          timeLimitMin: md.exam.timeLimitMin,
          passingScore: md.exam.passingScore,
          shuffle: true,
          maxAttempts: 3,
        },
      });

      const questions = questionBank(exam.id, mi, ci);
      await prisma.question.createMany({ data: questions });
    }
  }

  console.log('✅ Seed tamamlandı');
  console.log('Instructor: 05551112233 / Test1234');
  console.log('Student:    05554445566 / Test1234');
  console.log('Admin:      05557778899 / Test1234');
  console.log('Bera:       05550000000 / Bera1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
