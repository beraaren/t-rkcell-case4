import type { Course, User, Question } from "./types";

export const SEED_USERS: (User & { password: string })[] = [
  { id: "u-instructor", gsm: "05551112233", password: "Test1234", name: "Ayşe Yılmaz", role: "INSTRUCTOR", bio: "Senior Frontend Mühendisi · 8 yıl deneyim" },
  { id: "u-student", gsm: "05554445566", password: "Test1234", name: "Mehmet Demir", role: "STUDENT", bio: "Yazılım öğrencisi" },
  { id: "u-admin", gsm: "05557778899", password: "Test1234", name: "Admin", role: "ADMIN" },
];

const mc = (text: string, opts: [string, boolean][]): Omit<Question, "id" | "examId" | "orderIndex"> => ({
  type: "MULTIPLE_CHOICE",
  text,
  options: opts.map(([t, c], i) => ({ id: String.fromCharCode(97 + i), text: t, isCorrect: c })),
});
const tf = (text: string, correct: boolean): Omit<Question, "id" | "examId" | "orderIndex"> => ({
  type: "TRUE_FALSE",
  text,
  options: [
    { id: "a", text: "Doğru", isCorrect: correct },
    { id: "b", text: "Yanlış", isCorrect: !correct },
  ],
});
const ms = (text: string, opts: [string, boolean][]): Omit<Question, "id" | "examId" | "orderIndex"> => ({
  type: "MULTI_SELECT",
  text,
  options: opts.map(([t, c], i) => ({ id: String.fromCharCode(97 + i), text: t, isCorrect: c })),
});

let qCounter = 0;
const qId = () => `q-${++qCounter}`;
const buildExam = (moduleId: string, timeLimit: number, qs: Omit<Question, "id" | "examId" | "orderIndex">[]) => {
  const examId = `e-${moduleId}`;
  return {
    id: examId,
    moduleId,
    timeLimitMin: timeLimit,
    passingScore: 60,
    shuffle: true,
    maxAttempts: 3,
    questions: qs.map((q, i) => ({ ...q, id: qId(), examId, orderIndex: i })),
  };
};

const buildLessons = (moduleId: string, titles: { title: string; content: string }[]) =>
  titles.map((t, i) => ({
    id: `l-${moduleId}-${i + 1}`,
    moduleId,
    title: t.title,
    content: t.content,
    estimatedDuration: 12,
    orderIndex: i,
  }));

export const SEED_COURSES: Course[] = [
  {
    id: "c-js",
    instructorId: "u-instructor",
    instructorName: "Ayşe Yılmaz",
    title: "JavaScript Temelleri",
    description: "Modern JavaScript'in temel taşları: değişkenler, fonksiyonlar, asenkron programlama ve daha fazlası.",
    category: "Programlama",
    level: "BEGINNER",
    coverEmoji: "🟨",
    estimatedDuration: 480,
    status: "PUBLISHED",
    modules: [
      {
        id: "m-js-1", courseId: "c-js", orderIndex: 0,
        title: "Dile Giriş", description: "JavaScript ekosistemi ve temel sözdizimi.",
        lessons: buildLessons("m-js-1", [
          { title: "JavaScript nedir?", content: "JavaScript, web tarayıcıları için tasarlanmış yüksek seviyeli, dinamik bir programlama dilidir. Bugün Node.js sayesinde sunucu tarafında da yaygın olarak kullanılmaktadır.\n\nBu derste tarihçesini, ECMAScript standardını ve modern JS'in nerelerde çalıştığını inceleyeceğiz." },
          { title: "Değişkenler ve veri tipleri", content: "let, const ve var arasındaki farklar; primitive ve object tipleri; type coercion ve karşılaştırma operatörleri." },
          { title: "Operatörler ve kontrol akışı", content: "Aritmetik, mantıksal, ternary operatörler; if/else, switch ve döngüler." },
        ]),
        exam: buildExam("m-js-1", 5, [
          mc("`typeof null` ifadesinin sonucu nedir?", [["'null'", false], ["'object'", true], ["'undefined'", false], ["'number'", false]]),
          tf("`const` ile tanımlanan bir nesnenin özellikleri değiştirilebilir.", true),
          ms("Aşağıdakilerden hangileri primitive veri tipidir?", [["string", true], ["number", true], ["array", false], ["boolean", true]]),
          mc("`'5' + 3` ifadesinin sonucu nedir?", [["8", false], ["'53'", true], ["NaN", false], ["Hata", false]]),
          tf("JavaScript single-threaded bir dildir.", true),
          mc("Hangisi geçerli bir değişken adı değildir?", [["_count", false], ["$value", false], ["2items", true], ["userName", false]]),
          ms("Aşağıdakilerden hangileri falsy değerdir?", [["0", true], ["''", true], ["'false'", false], ["null", true]]),
          mc("`===` operatörü neyi kontrol eder?", [["Sadece değer", false], ["Değer ve tip", true], ["Sadece tip", false], ["Hiçbiri", false]]),
          tf("`let` ile tanımlanan değişkenler block-scoped'dır.", true),
          mc("ECMAScript hangi yıl ilk kez yayınlandı?", [["1995", false], ["1997", true], ["2000", false], ["2005", false]]),
        ]),
      },
      {
        id: "m-js-2", courseId: "c-js", orderIndex: 1,
        title: "Fonksiyonlar ve Kapsam", description: "Fonksiyonlar, closure ve scope kavramları.",
        lessons: buildLessons("m-js-2", [
          { title: "Fonksiyon tanımlama", content: "Function declaration, function expression ve arrow function arasındaki farklar." },
          { title: "Scope ve closure", content: "Lexical scope, closure örnekleri ve pratik kullanım alanları." },
          { title: "this anahtar kelimesi", content: "this'in farklı bağlamlarda nasıl davrandığı; bind, call, apply." },
        ]),
        exam: buildExam("m-js-2", 5, [
          mc("Arrow function'ın klasik fonksiyondan en önemli farkı nedir?", [["Daha hızlıdır", false], ["Kendi `this`'i yoktur", true], ["return zorunludur", false], ["async olamaz", false]]),
          tf("Closure, fonksiyonun tanımlandığı kapsama erişimini korur.", true),
          ms("Aşağıdakilerden hangileri fonksiyon tanımlama yoludur?", [["function f(){}", true], ["const f = () => {}", true], ["function: f(){}", false], ["const f = function(){}", true]]),
          mc("`bind` metodu ne yapar?", [["Fonksiyonu çalıştırır", false], ["Yeni bir fonksiyon döner", true], ["this'i siler", false], ["Argüman ekler", false]]),
          tf("IIFE bir fonksiyonun tanımlandığı anda çalıştırılmasını sağlar.", true),
          mc("Hoisting nedir?", [["Değişken silme", false], ["Tanımlamaların yukarı taşınması", true], ["Bellek temizleme", false], ["Tip dönüşümü", false]]),
          ms("`this` aşağıdakilerin hangilerinde değişebilir?", [["call", true], ["apply", true], ["bind", true], ["typeof", false]]),
          mc("Default parameter değeri ne zaman uygulanır?", [["Her zaman", false], ["Argüman undefined ise", true], ["Argüman null ise", false], ["Hiçbir zaman", false]]),
          tf("Rest parametreleri bir fonksiyonun son parametresi olmalıdır.", true),
          mc("`(function(){return this})()` strict mode'da ne döner?", [["window", false], ["undefined", true], ["null", false], ["global", false]]),
        ]),
      },
      {
        id: "m-js-3", courseId: "c-js", orderIndex: 2,
        title: "Asenkron JavaScript", description: "Promises, async/await ve event loop.",
        lessons: buildLessons("m-js-3", [
          { title: "Event loop", content: "Call stack, task queue, microtask queue ve event loop'un işleyişi." },
          { title: "Promises", content: "Promise yaşam döngüsü, then/catch/finally, Promise.all ve Promise.race." },
          { title: "async / await", content: "Modern asenkron kod yazımı, hata yönetimi ve sıralı/paralel çağrılar." },
        ]),
        exam: buildExam("m-js-3", 5, [
          mc("`await` anahtar kelimesi nerede kullanılabilir?", [["Her yerde", false], ["async fonksiyon içinde", true], ["Sadece global scope'da", false], ["Sınıf içinde", false]]),
          tf("Promise.all bir tane bile reject olursa hepsini reddeder.", true),
          ms("Aşağıdakilerden hangileri microtask kuyruğuna girer?", [["Promise.then", true], ["queueMicrotask", true], ["setTimeout", false], ["setImmediate", false]]),
          mc("Promise'ın 3 durumu nedir?", [["start, end, error", false], ["pending, fulfilled, rejected", true], ["open, close, error", false], ["init, run, done", false]]),
          tf("setTimeout(fn, 0) bir sonraki tick'te çalışır, anlık değil.", true),
          mc("Hangisi tüm promise'lerin sonuçlanmasını bekler ama reject olsa bile devam eder?", [["Promise.all", false], ["Promise.race", false], ["Promise.allSettled", true], ["Promise.any", false]]),
          ms("async fonksiyon hakkında doğru olanlar:", [["Her zaman Promise döner", true], ["throw'u reject'e çevirir", true], ["Senkron çalışır", false], ["await ile beklenebilir", true]]),
          mc("Event loop hangi kuyruğu önce işler?", [["Macrotask", false], ["Microtask", true], ["Aynı anda", false], ["Random", false]]),
          tf("fetch fonksiyonu bir Promise döner.", true),
          mc("`Promise.race`'in davranışı nedir?", [["Hepsini bekler", false], ["İlk sonuçlananı döner", true], ["Hiçbirini beklemez", false], ["Sadece resolve olanları döner", false]]),
        ]),
      },
    ],
  },
  {
    id: "c-react",
    instructorId: "u-instructor",
    instructorName: "Ayşe Yılmaz",
    title: "React ile Modern Web",
    description: "Component bazlı düşünme, hooks, state yönetimi ve performans optimizasyonu.",
    category: "Frontend",
    level: "INTERMEDIATE",
    coverEmoji: "⚛️",
    estimatedDuration: 600,
    status: "PUBLISHED",
    modules: [
      {
        id: "m-react-1", courseId: "c-react", orderIndex: 0,
        title: "React'a Giriş", description: "JSX, component'ler ve props.",
        lessons: buildLessons("m-react-1", [
          { title: "JSX nedir?", content: "JSX, JavaScript içinde XML benzeri sözdizimi yazmamıza izin verir. Babel tarafından React.createElement çağrılarına dönüştürülür." },
          { title: "Component'ler", content: "Function ve class component'ler, composition ile UI inşası." },
          { title: "Props ve children", content: "Props ile veri akışı, children prop'u ve composition pattern." },
        ]),
        exam: buildExam("m-react-1", 5, [
          mc("JSX neye dönüşür?", [["HTML", false], ["React.createElement çağrılarına", true], ["String'e", false], ["JSON'a", false]]),
          tf("Props, child component tarafından değiştirilemez.", true),
          ms("Geçerli component isimleri:", [["userCard", false], ["UserCard", true], ["User_Card", false], ["MyButton", true]]),
          mc("Bir component birden fazla element döndürmek istiyorsa ne kullanır?", [["array", false], ["Fragment", true], ["div zorunlu", false], ["span", false]]),
          tf("class component'ler hala desteklenmektedir.", true),
          mc("`children` prop'u nedir?", [["Özel bir hook", false], ["Component'in iç içeriği", true], ["State", false], ["Ref", false]]),
          ms("Hangileri React'in özelliklerindendir?", [["Virtual DOM", true], ["Tek yönlü veri akışı", true], ["Two-way binding", false], ["Component bazlı yapı", true]]),
          mc("React'i kim geliştirdi?", [["Google", false], ["Facebook (Meta)", true], ["Microsoft", false], ["Twitter", false]]),
          tf("React'te key prop'u liste render'larında önemlidir.", true),
          mc("Conditional rendering için en yaygın yöntem nedir?", [["if-else JSX dışında", false], ["Ternary veya &&", true], ["switch", false], ["for", false]]),
        ]),
      },
      {
        id: "m-react-2", courseId: "c-react", orderIndex: 1,
        title: "Hooks", description: "useState, useEffect ve diğer hook'lar.",
        lessons: buildLessons("m-react-2", [
          { title: "useState", content: "Component içinde state yönetimi, batching davranışı." },
          { title: "useEffect", content: "Side effect'ler, dependency array ve cleanup fonksiyonu." },
          { title: "Custom hook'lar", content: "Tekrar kullanılabilir mantığı hook'lara taşıma." },
        ]),
        exam: buildExam("m-react-2", 5, [
          mc("useState ne döner?", [["Tek değer", false], ["[state, setter] tuple", true], ["Object", false], ["Promise", false]]),
          tf("useEffect varsayılan olarak her render'dan sonra çalışır.", true),
          ms("Hook kuralları:", [["Sadece top-level", true], ["Sadece React fonksiyonlarında", true], ["Loop içinde çağrılabilir", false], ["if içinde çağrılabilir", false]]),
          mc("useEffect cleanup ne zaman çalışır?", [["Mount'ta", false], ["Unmount ve dependency değişiminde", true], ["Hiçbir zaman", false], ["Sadece unmount'ta", false]]),
          tf("Custom hook isimleri 'use' ile başlamalıdır.", true),
          mc("useMemo neyi optimize eder?", [["Render sayısını", false], ["Pahalı hesaplamaları", true], ["Network'ü", false], ["DOM'u", false]]),
          ms("Hangisi React hook'tur?", [["useState", true], ["useContext", true], ["useFetch", false], ["useReducer", true]]),
          mc("Boş dependency array `[]` ne anlama gelir?", [["Her render", false], ["Sadece mount'ta bir kez", true], ["Hiçbir zaman", false], ["Unmount'ta", false]]),
          tf("useCallback bir fonksiyonu memoize eder.", true),
          mc("Stale closure sorunu çoğunlukla hangi hook'la ilgilidir?", [["useState", false], ["useEffect", true], ["useRef", false], ["useId", false]]),
        ]),
      },
      {
        id: "m-react-3", courseId: "c-react", orderIndex: 2,
        title: "Performans ve State", description: "Context, memo ve render optimizasyonu.",
        lessons: buildLessons("m-react-3", [
          { title: "Context API", content: "Prop drilling'den kaçınmak için Context kullanımı." },
          { title: "React.memo ve useMemo", content: "Gereksiz render'ları önleme stratejileri." },
          { title: "State yönetim kütüphaneleri", content: "Redux, Zustand ve React Query'ye genel bakış." },
        ]),
        exam: buildExam("m-react-3", 5, [
          mc("React.memo ne yapar?", [["State yönetir", false], ["Component'i prop değişimine göre memoize eder", true], ["DOM'u günceller", false], ["Hook'tur", false]]),
          tf("Context her değiştiğinde tüm tüketici component'ler yeniden render olur.", true),
          ms("Performans optimizasyon araçları:", [["React.memo", true], ["useMemo", true], ["useCallback", true], ["useState", false]]),
          mc("React Query'nin temel görevi nedir?", [["State yönetimi", false], ["Server state yönetimi ve cache", true], ["Routing", false], ["Form yönetimi", false]]),
          tf("Zustand context'siz global state sağlar.", true),
          mc("Prop drilling nedir?", [["State yukarı taşıma", false], ["Prop'u çok katmandan geçirme", true], ["Hook chain", false], ["Render optimizasyonu", false]]),
          ms("React 18 yenilikleri:", [["Concurrent rendering", true], ["Automatic batching", true], ["Suspense for data", true], ["Class component zorunluluğu", false]]),
          mc("useReducer ne zaman tercih edilir?", [["Basit boolean state'lerde", false], ["Karmaşık state geçişlerinde", true], ["Hiçbir zaman", false], ["DOM manipülasyonunda", false]]),
          tf("React Strict Mode geliştirme sırasında bazı fonksiyonları iki kez çağırır.", true),
          mc("Suspense ne için kullanılır?", [["Hata yönetimi", false], ["Async render fallback'i", true], ["Form validation", false], ["Routing", false]]),
        ]),
      },
    ],
  },
  {
    id: "c-system",
    instructorId: "u-instructor",
    instructorName: "Ayşe Yılmaz",
    title: "Sistem Tasarımı",
    description: "Ölçeklenebilir sistemlerin temel ilkeleri: caching, load balancing, database tasarımı.",
    category: "Mimari",
    level: "ADVANCED",
    coverEmoji: "🏗️",
    estimatedDuration: 720,
    status: "PUBLISHED",
    modules: [
      {
        id: "m-sys-1", courseId: "c-system", orderIndex: 0,
        title: "Temel Kavramlar", description: "Latency, throughput, availability.",
        lessons: buildLessons("m-sys-1", [
          { title: "Latency vs throughput", content: "Latency tek bir isteğin süresidir; throughput birim zamandaki istek sayısıdır." },
          { title: "CAP teoremi", content: "Consistency, Availability, Partition tolerance — üçünü aynı anda elde etmek mümkün değildir." },
          { title: "SLA, SLO, SLI", content: "Servis seviyesi anlaşmaları, hedefleri ve göstergeleri." },
        ]),
        exam: buildExam("m-sys-1", 5, [
          mc("CAP teoreminde C harfi neyi temsil eder?", [["Cache", false], ["Consistency", true], ["Concurrency", false], ["Capacity", false]]),
          tf("Yüksek availability genelde eventual consistency ile gelir.", true),
          ms("Aşağıdakilerden hangileri ölçülebilir SLI'dır?", [["Uptime yüzdesi", true], ["İsteğin p95 latency'si", true], ["Geliştirici sayısı", false], ["Hata oranı", true]]),
          mc("99.9% uptime yıllık ne kadar downtime demektir (yaklaşık)?", [["8 dakika", false], ["8 saat", true], ["2 gün", false], ["1 ay", false]]),
          tf("Throughput istek/saniye olarak ifade edilebilir.", true),
          mc("Vertical scaling nedir?", [["Sunucu sayısını artırma", false], ["Sunucu kaynaklarını büyütme", true], ["Cache ekleme", false], ["DB değiştirme", false]]),
          ms("Yatay ölçekleme avantajları:", [["Tek başına sınırsız değil ama esnek", true], ["Daha iyi fault tolerance", true], ["Stateless tasarımı zorunlu kılar", true], ["Tek sunucudan ucuz", false]]),
          mc("Idempotent bir endpoint'in özelliği nedir?", [["Her zaman 200 döner", false], ["Aynı isteğin tekrarı aynı sonucu verir", true], ["Asenkrondur", false], ["Hızlıdır", false]]),
          tf("p99 latency, isteklerin %99'unun bu süreden hızlı olduğu anlamına gelir.", true),
          mc("Backpressure ne için kullanılır?", [["Cache temizleme", false], ["Aşırı yükü yönetme", true], ["Auth", false], ["Logging", false]]),
        ]),
      },
      {
        id: "m-sys-2", courseId: "c-system", orderIndex: 1,
        title: "Caching ve Load Balancing", description: "Performans için cache stratejileri.",
        lessons: buildLessons("m-sys-2", [
          { title: "Cache stratejileri", content: "Cache-aside, write-through, write-behind." },
          { title: "Load balancer'lar", content: "L4 vs L7, round-robin, least connections, sticky session." },
          { title: "CDN", content: "Edge caching ve global içerik dağıtımı." },
        ]),
        exam: buildExam("m-sys-2", 5, [
          mc("Cache-aside pattern'ında uygulamanın sorumluluğu nedir?", [["Cache yok", false], ["Cache miss'te DB'den okuyup cache'i doldurmak", true], ["Sadece yazmak", false], ["Hiçbiri", false]]),
          tf("CDN statik içerikleri kullanıcıya yakın edge node'lardan servis eder.", true),
          ms("Yaygın load balancing algoritmaları:", [["Round-robin", true], ["Least connections", true], ["Random", true], ["FIFO ekran", false]]),
          mc("Cache invalidation neden zordur?", [["Yavaştır", false], ["Tutarlılığı korumak karmaşıktır", true], ["Pahalıdır", false], ["İmkansızdır", false]]),
          tf("Layer 7 load balancer HTTP başlıklarına göre yönlendirme yapabilir.", true),
          mc("TTL ne demek?", [["Total Time Limit", false], ["Time To Live", true], ["Total Throughput Latency", false], ["Type Tracking Layer", false]]),
          ms("Cache eviction politikaları:", [["LRU", true], ["LFU", true], ["FIFO", true], ["JWT", false]]),
          mc("Sticky session neyi garanti eder?", [["Tüm session'lar aynı sunucuya gider", true], ["Session yok edilmez", false], ["Session paylaşılır", false], ["Hiçbiri", false]]),
          tf("Redis bir in-memory key-value store'dur.", true),
          mc("Edge caching'in birincil avantajı nedir?", [["Maliyet", false], ["Düşük latency", true], ["Güvenlik", false], ["Backup", false]]),
        ]),
      },
      {
        id: "m-sys-3", courseId: "c-system", orderIndex: 2,
        title: "Veritabanı Tasarımı", description: "SQL, NoSQL, sharding ve replikasyon.",
        lessons: buildLessons("m-sys-3", [
          { title: "SQL vs NoSQL", content: "İlişkisel ve doküman tabanlı veritabanlarının kullanım senaryoları." },
          { title: "Replikasyon", content: "Master-slave, multi-master ve okuma kopyaları." },
          { title: "Sharding", content: "Veriyi yatay bölümlere ayırma ve consistent hashing." },
        ]),
        exam: buildExam("m-sys-3", 5, [
          mc("Sharding nedir?", [["Veriyi yatay bölme", true], ["Veriyi sıkıştırma", false], ["Cache stratejisi", false], ["Index türü", false]]),
          tf("ACID özellikleri ilişkisel veritabanlarının temel garantileridir.", true),
          ms("NoSQL veritabanı türleri:", [["Doküman", true], ["Key-value", true], ["Graph", true], ["Tablosal-only", false]]),
          mc("Read replica'nın temel amacı nedir?", [["Yazma performansı", false], ["Okuma yükünü dağıtmak", true], ["Backup", false], ["Auth", false]]),
          tf("Consistent hashing, node ekleme/çıkarmada minimum yeniden dağıtım sağlar.", true),
          mc("Index'in dezavantajı nedir?", [["Okumayı yavaşlatır", false], ["Yazmayı yavaşlatır ve disk kullanır", true], ["Yoktur", false], ["Tutarlılığı bozar", false]]),
          ms("Normalleştirme avantajları:", [["Veri tekrarını azaltır", true], ["Tutarlılığı artırır", true], ["Storage tasarrufu", true], ["Her zaman daha hızlıdır", false]]),
          mc("Eventual consistency ne demek?", [["Asla tutarlı olmaz", false], ["Sonunda tutarlı olur", true], ["Anlık tutarlıdır", false], ["Tutarlılık yoktur", false]]),
          tf("Two-phase commit dağıtık transaction için kullanılır.", true),
          mc("Hangi veritabanı türü ilişkiler için en uygundur?", [["Document", false], ["Key-value", false], ["Relational", true], ["Time-series", false]]),
        ]),
      },
    ],
  },
];
