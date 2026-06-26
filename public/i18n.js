/* Scale9X — lightweight dictionary-based i18n (EN / ID).
   Switches UI labels, navigation, buttons and section headings.
   Client-entered content (interview answers, report data) is never translated. */
(function(){
  const DICT = {
    en: {
      // brand
      'brand.tag':'Growth Leadership',
      // nav
      'nav.dashboard':'Dashboard','nav.profile':'Business Profile','nav.interview':'Discovery Interview',
      'nav.team':'Team & Access','nav.smart':'Smart Discovery','nav.documents':'Document Vault',
      'nav.review':'Review & Submit','nav.reports':'Reports','signout':'Sign out','signedin':'Signed in',
      // status
      'status.delivered':'Delivered','status.review':'Under review','status.complete':'complete',
      // auth
      'auth.welcome':'Welcome back','auth.create':'Create your account',
      'auth.signin_sub':'Sign in to continue.','auth.signup_sub':'Start your guided business discovery.',
      'auth.name':'Your name','auth.company':'Company','auth.email':'Email','auth.password':'Password',
      'auth.signin':'Sign in','auth.createacct':'Create account',
      'auth.haveacct':'Have an account?','auth.signin_link':'Sign in',
      'auth.new':'New here?','auth.create_link':'Create an account',
      'auth.lead':'A guided discovery of your business — led by Scale9X.',
      'auth.leadsub':'Not a form. A structured conversation that helps us understand your business deeply, before we diagnose your growth.',
      'auth.p1':'50+ growth indicators assessed across 10 business dimensions',
      'auth.p2':'Built on consulting-grade diagnostic frameworks',
      'auth.p3':'A boardroom-ready growth report in days, not months',
      'auth.confidential':'Confidential · Scale9X',
      // dashboard
      'db.welcome':'Welcome','db.hello':'Hello','db.continue':'Continue','db.viewstatus':'View status',
      'db.next':'Your next action','db.gonow':'Go now','db.progress':'Discovery progress',
      'db.inprogress':'In progress','db.submitted':'Submitted — under review',
      'db.intro':"Let's understand your business. The more you share, the sharper your growth diagnostic.",
      'db.yourdiag':'Your Diagnostic','db.maturity':'Growth Maturity','db.potential':'Growth Potential',
      'db.matrix':'Magic Matrix','db.openreport':'Open full report','db.priorities':'Top growth priorities',
      'db.status':'Status','db.reportcenter':'Report Center','db.ready':'Your growth diagnostic is ready',
      // buttons
      'btn.continue':'Continue','btn.savecontinue':'Save & continue','btn.submit':'Submit for Diagnostic',
      'btn.back':'Back',
      // report
      'r.kicker':'Scale9X Growth Diagnostic','r.delivered':'Delivered','r.confidential':'Strictly Confidential',
      'r.download':'Download / Print PDF','r.reportcenter':'Report Center','r.yourreports':'Your reports',
      'r.reportsub':'Diagnostic reports delivered by the Scale9X team. Published versions only.',
      'r.open':'Open','r.growthdiag':'Growth Diagnostic',
      'r.exec':'Executive Summary','r.reality':'Business Reality','r.scores':'Diagnostic Scores',
      'r.magic':'Magic Matrix','r.sw':'Strengths & Priority Weaknesses','r.findings':'Key Findings',
      'r.narrative':'Diagnostic Narrative','r.opp':'Opportunity Matrix','r.rec':'Strategic Recommendations',
      'r.plan':'90-Day Plan','r.roadmap':'12-Month Roadmap','r.kpi':'KPI Framework','r.budget':'Budget Allocation',
      'r.takeaways':'Key Takeaways','r.situation':'Situation','r.diagnosis':'Diagnosis',
      'r.costinaction':'Cost of inaction','r.opportunity':'Opportunity','r.prescription':'Prescription',
      'r.strengths':'Strengths','r.weaknesses':'Priority weaknesses',
      'r.quickwins':'Quick Wins','r.strategic':'Strategic Initiatives','r.longterm':'Long-Term','r.transformation':'Transformation',
      // finding labels
      'f.observation':'Observation','f.rootcause':'Root Cause','f.impact':'Business Impact',
      'f.action':'Recommended Action','f.priority':'Priority','f.benefit':'Potential Benefit',
      'sev.high':'High','sev.medium':'Medium','sev.low':'Low',
      'r.blueprint':'Growth Blueprint','r.blueprintsub':'If you read one page, read this — the whole diagnostic distilled into an action plan.',
      'r.next30':'NEXT 30 DAYS','r.next90':'NEXT 90 DAYS','r.next12':'NEXT 12 MONTHS',
      'r.bp30':'Fix what is leaking now','r.bp30sub':'The highest-leverage actions to start this month',
      'r.bp90':'Build the growth engine','r.bp90sub':'Turn the fixes into repeatable systems',
      'r.bp12':'Scale & strategic priorities','r.bp12sub':'Where the business should be heading',
      'r.revexp':'Revenue Expansion Opportunities','r.revexpsub':'Where future revenue can come from',
      'r.difficulty':'Difficulty','r.impact2':'Impact','r.timeline':'Timeline',
      'r.bets':'Strategic Bets','r.betssub':'High-upside moves that could make this business many times larger',
      'r.focusignore':'What To Focus On — and What To Ignore','r.focus':'Focus on this now','r.ignore':'Ignore for now',
      'r.qwsub':'Recover value fast','r.sisub':'Grow in 3–12 months','r.ltsub':'Bigger plays, 12+ months','r.trsub':'Transformational bets',
      'r.outcome':'Outcome'
    },
    id: {
      'brand.tag':'Growth Leadership',
      'nav.dashboard':'Dasbor','nav.profile':'Profil Bisnis','nav.interview':'Wawancara Bisnis',
      'nav.team':'Tim & Akses','nav.smart':'Ringkasan Cerdas','nav.documents':'Brankas Dokumen',
      'nav.review':'Tinjau & Kirim','nav.reports':'Laporan','signout':'Keluar','signedin':'Masuk sebagai',
      'status.delivered':'Terkirim','status.review':'Sedang ditinjau','status.complete':'selesai',
      'auth.welcome':'Selamat datang kembali','auth.create':'Buat akun Anda',
      'auth.signin_sub':'Masuk untuk melanjutkan.','auth.signup_sub':'Mulai penemuan bisnis terpandu Anda.',
      'auth.name':'Nama Anda','auth.company':'Perusahaan','auth.email':'Email','auth.password':'Kata sandi',
      'auth.signin':'Masuk','auth.createacct':'Buat akun',
      'auth.haveacct':'Sudah punya akun?','auth.signin_link':'Masuk',
      'auth.new':'Baru di sini?','auth.create_link':'Buat akun',
      'auth.lead':'Penemuan bisnis Anda yang terpandu — oleh Scale9X.',
      'auth.leadsub':'Bukan formulir. Sebuah percakapan terstruktur yang membantu kami memahami bisnis Anda secara mendalam, sebelum mendiagnosis pertumbuhan Anda.',
      'auth.p1':'50+ indikator pertumbuhan dinilai pada 10 dimensi bisnis',
      'auth.p2':'Dibangun di atas kerangka diagnostik setara konsultan',
      'auth.p3':'Laporan pertumbuhan siap-rapat direksi dalam hitungan hari, bukan bulan',
      'auth.confidential':'Rahasia · Scale9X',
      'db.welcome':'Selamat Datang','db.hello':'Halo','db.continue':'Lanjutkan','db.viewstatus':'Lihat status',
      'db.next':'Tindakan berikutnya','db.gonow':'Buka sekarang','db.progress':'Kemajuan penemuan',
      'db.inprogress':'Sedang berlangsung','db.submitted':'Terkirim — sedang ditinjau',
      'db.intro':'Mari pahami bisnis Anda. Semakin banyak yang Anda bagikan, semakin tajam diagnostik pertumbuhan Anda.',
      'db.yourdiag':'Diagnostik Anda','db.maturity':'Kematangan Pertumbuhan','db.potential':'Potensi Pertumbuhan',
      'db.matrix':'Magic Matrix','db.openreport':'Buka laporan lengkap','db.priorities':'Prioritas pertumbuhan utama',
      'db.status':'Status','db.reportcenter':'Pusat Laporan','db.ready':'Diagnostik pertumbuhan Anda sudah siap',
      'btn.continue':'Lanjutkan','btn.savecontinue':'Simpan & lanjutkan','btn.submit':'Kirim untuk Diagnostik',
      'btn.back':'Kembali',
      'r.kicker':'Scale9X Growth Diagnostic','r.delivered':'Terkirim','r.confidential':'Sangat Rahasia',
      'r.download':'Unduh / Cetak PDF','r.reportcenter':'Pusat Laporan','r.yourreports':'Laporan Anda',
      'r.reportsub':'Laporan diagnostik yang dikirim oleh tim Scale9X. Hanya versi yang diterbitkan.',
      'r.open':'Buka','r.growthdiag':'Diagnostik Pertumbuhan',
      'r.exec':'Ringkasan Eksekutif','r.reality':'Realitas Bisnis','r.scores':'Skor Diagnostik',
      'r.magic':'Magic Matrix','r.sw':'Kekuatan & Kelemahan Prioritas','r.findings':'Temuan Utama',
      'r.narrative':'Narasi Diagnostik','r.opp':'Matriks Peluang','r.rec':'Rekomendasi Strategis',
      'r.plan':'Rencana 90 Hari','r.roadmap':'Peta Jalan 12 Bulan','r.kpi':'Kerangka KPI','r.budget':'Alokasi Anggaran',
      'r.takeaways':'Poin Utama','r.situation':'Situasi','r.diagnosis':'Diagnosis',
      'r.costinaction':'Biaya jika diabaikan','r.opportunity':'Peluang','r.prescription':'Rekomendasi',
      'r.strengths':'Kekuatan','r.weaknesses':'Kelemahan prioritas',
      'r.quickwins':'Kemenangan Cepat','r.strategic':'Inisiatif Strategis','r.longterm':'Jangka Panjang','r.transformation':'Transformasi',
      'f.observation':'Observasi','f.rootcause':'Akar Masalah','f.impact':'Dampak Bisnis',
      'f.action':'Tindakan yang Disarankan','f.priority':'Prioritas','f.benefit':'Potensi Manfaat',
      'sev.high':'Tinggi','sev.medium':'Sedang','sev.low':'Rendah',
      'r.blueprint':'Cetak Biru Pertumbuhan','r.blueprintsub':'Jika Anda hanya membaca satu halaman, baca ini — seluruh diagnostik diringkas menjadi rencana aksi.',
      'r.next30':'30 HARI KE DEPAN','r.next90':'90 HARI KE DEPAN','r.next12':'12 BULAN KE DEPAN',
      'r.bp30':'Perbaiki yang bocor sekarang','r.bp30sub':'Tindakan berdampak tertinggi untuk dimulai bulan ini',
      'r.bp90':'Bangun mesin pertumbuhan','r.bp90sub':'Ubah perbaikan menjadi sistem yang dapat diulang',
      'r.bp12':'Skala & prioritas strategis','r.bp12sub':'Ke mana arah bisnis seharusnya',
      'r.revexp':'Peluang Ekspansi Pendapatan','r.revexpsub':'Dari mana pendapatan masa depan bisa berasal',
      'r.difficulty':'Kesulitan','r.impact2':'Dampak','r.timeline':'Waktu',
      'r.bets':'Taruhan Strategis','r.betssub':'Langkah berpotensi tinggi yang dapat membuat bisnis ini berlipat ganda',
      'r.focusignore':'Apa yang Difokuskan — dan Apa yang Diabaikan','r.focus':'Fokus pada ini sekarang','r.ignore':'Abaikan untuk saat ini',
      'r.qwsub':'Pulihkan nilai dengan cepat','r.sisub':'Tumbuh dalam 3–12 bulan','r.ltsub':'Langkah besar, 12+ bulan','r.trsub':'Taruhan transformasional',
      'r.outcome':'Hasil'
    }
  };
  window.I18N = DICT;
  window.LANG = (function(){ try{ return localStorage.getItem('ila_lang') || 'en'; }catch(e){ return 'en'; } })();
  window.t = function(key){ const L = window.LANG||'en'; return (DICT[L] && DICT[L][key]) || DICT.en[key] || key; };
  window.setLang = function(l){
    window.LANG = (l==='id')?'id':'en';
    try{ localStorage.setItem('ila_lang', window.LANG); }catch(e){}
    document.documentElement.lang = window.LANG;
    if (typeof window.render === 'function') window.render();
  };
  // ---- Smart Insights: rotating consulting/growth wisdom shown across the journey ----
  window.INSIGHTS = {
    en: [
      "Companies with documented growth systems grow <b>2.3×</b> faster than founder-led businesses.",
      "Most companies lose <b>30–50%</b> of opportunities before the first sales conversation.",
      "Founders often overestimate marketing performance and underestimate operational bottlenecks.",
      "Growth is rarely limited by demand — it's usually limited by <b>systems</b>.",
      "The fastest-growing businesses fix their weakest link first, not their strongest.",
      "A sharp ideal-customer profile can cut customer-acquisition cost by up to <b>40%</b>.",
      "Businesses that track conversion at every funnel stage convert <b>2×</b> more leads.",
      "Most revenue leaks happen in the gaps between teams, not within them.",
      "Scaling a broken process just scales the problem — diagnose before you accelerate.",
      "What gets measured gets managed; what gets managed gets improved."
    ],
    id: [
      "Perusahaan dengan sistem pertumbuhan terdokumentasi tumbuh <b>2,3×</b> lebih cepat daripada bisnis yang bergantung pada pendiri.",
      "Kebanyakan perusahaan kehilangan <b>30–50%</b> peluang sebelum percakapan penjualan pertama.",
      "Pendiri sering melebih-lebihkan kinerja pemasaran dan meremehkan hambatan operasional.",
      "Pertumbuhan jarang dibatasi oleh permintaan — biasanya dibatasi oleh <b>sistem</b>.",
      "Bisnis yang tumbuh tercepat memperbaiki mata rantai terlemah lebih dulu, bukan yang terkuat.",
      "Profil pelanggan ideal yang tajam dapat memangkas biaya akuisisi hingga <b>40%</b>.",
      "Bisnis yang melacak konversi di setiap tahap funnel mengonversi <b>2×</b> lebih banyak prospek.",
      "Sebagian besar kebocoran pendapatan terjadi di celah antar tim, bukan di dalamnya.",
      "Menskalakan proses yang rusak hanya memperbesar masalah — diagnosis dulu sebelum berakselerasi.",
      "Apa yang diukur akan dikelola; apa yang dikelola akan membaik."
    ]
  };
  window.insightHTML = function(dark){
    const L = window.LANG || 'en';
    const arr = (window.INSIGHTS[L] && window.INSIGHTS[L].length) ? window.INSIGHTS[L] : window.INSIGHTS.en;
    const i = Math.floor(Math.random() * arr.length);
    return '<div class="insight'+(dark?' dark':'')+'"><span class="ico">💡</span><span class="tx">'+arr[i]+'</span></div>';
  };
  window.langSelect = function(){
    return '<span class="langsel"><span class="globe">🌐</span><select onchange="setLang(this.value)">'
      + '<option value="en"'+(window.LANG==='en'?' selected':'')+'>EN</option>'
      + '<option value="id"'+(window.LANG==='id'?' selected':'')+'>ID</option></select></span>';
  };
})();
