let streakCount = 0;
let studyHistory = [];

// بارگذاری استریک و تاریخچه از localStorage
if (localStorage.getItem("streakCount")) {
    streakCount = parseInt(localStorage.getItem("streakCount"));
}

if (localStorage.getItem("studyHistory")) {
    studyHistory = JSON.parse(localStorage.getItem("studyHistory"));
    displayHistory(); // نمایش تاریخچه در ابتدا
    checkStreak(); // بررسی استریک و تاریخچه در ابتدا
}

// تابع برای ذخیره یادداشت
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به‌روزرسانی استریک
    incrementStreakOncePerDay();

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}

// نمایش تاریخچه مطالعه
function displayHistory() {
    const historyList = document.getElementById("streak-history");
    historyList.innerHTML = ""; // پاک کردن تاریخچه قدیمی

    // نمایش تاریخچه
    studyHistory.forEach((study, index) => {
        const li = document.createElement("li");

        let content = `${study.date}: ${study.text}`;

        // اضافه کردن تصویر
        if (study.image) {
            content += `<br><img src="${study.image}" alt="image" width="100px" onclick="showImage('${study.image}')">`;  // نمایش تصویر و کلیک روی آن برای بزرگ شدن
        }

        // اضافه کردن ویس
        if (study.voice) {
            content += `<br><audio controls><source src="${study.voice}" type="audio/mp3">Your browser does not support the audio element.</audio>`;
        }

        // دکمه حذف
        content += `<button onclick="deleteStudy(${index})">delete</button>`;

        li.innerHTML = content;
        historyList.appendChild(li);
    });
}

// حذف یک یادداشت خاص از تاریخچه
function deleteStudy(index) {
    // حذف یادداشت از آرایه تاریخچه
    studyHistory.splice(index, 1);

    // ذخیره مجدد تاریخچه در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به روز رسانی تاریخچه نمایش داده شده
    displayHistory();
}

// تابع برای شروع آزمون
async function startQuiz() {
    const studyText = document.getElementById('study-text').value;

    // درخواست به GPT برای تولید سوالات
    const prompt = `Based on the following study notes, generate a 10-question quiz in a mix of multiple-choice and open-ended format. The questions should test understanding of the key points in the notes:\n\n${studyText}`;
    const questions = await getGptResponse(prompt);

    // نمایش سوالات در صفحه
    const quizSection = document.getElementById('quizQuestions');
    quizSection.style.display = 'block';

    quizSection.innerHTML = ''; // پاک کردن سوالات قبلی

    // فرض کنید پاسخ GPT به صورت رشته‌ای از سوالات بر می‌گردد
    const questionsList = questions.split('\n').map(q => ({ question: q }));

    questionsList.forEach((question, index) => {
        quizSection.innerHTML += `
            <p>${index + 1}. ${question.question}</p>
            <input type="text" id="answer${index}" placeholder="پاسخ خود را وارد کنید">
        `;
    });

    quizSection.innerHTML += `<button onclick="submitQuiz()">ارسال آزمون</button>`;
}

// تابع برای ارسال پاسخ و بررسی آن
function submitQuiz() {
    const quizSection = document.getElementById('quizQuestions');
    let correctAnswers = 0;
    const totalQuestions = 10;  // تعداد سوالات

    // بررسی پاسخ‌ها
    for (let i = 0; i < totalQuestions; i++) {
        const userAnswer = document.getElementById(`answer${i}`).value;
        const correctAnswer = "پاسخ صحیح";  // این باید به‌طور خودکار از GPT یا دیتاهای دیگر بدست بیاد

        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            correctAnswers++;
        }
    }

    // محاسبه درصد درست
    const percentage = (correctAnswers / totalQuestions) * 100;

    // نمایش درصد و نتیجه
    quizSection.innerHTML += `<p>امتیاز شما: ${percentage}%</p>`;

    // به روز رسانی استریک
    incrementStreakOncePerDay();
}

// تابع برای دریافت پاسخ از GPT
async function getGptResponse(prompt) {
    const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer  ` // کلید API خود را وارد کنید
        },
        body: JSON.stringify({
            model: 'text-davinci-003',  // مدل GPT-3
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.7
        })
    });

    const data = await response.json();
    return data.choices[0].text.trim();  // دریافت پاسخ از GPT
}

// این تابع برای اطمینان از اینکه استریک فقط یک بار در روز افزایش پیدا کند
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    if (lastStreakDate !== today) {
        streakCount = streakCount === 0 ? 1 : streakCount + 1; // اگر استریک 0 باشد، از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}

// این تابع استریک را به روز رسانی می‌کند
function updateStreak() {
    // نمایش استریک در صفحه
    document.getElementById("streak-count").textContent = streakCount;
}

// این تابع برای نمایش عکس بزرگتر است
function showImage(imageUrl) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '80%';
    img.style.maxHeight = '80%';

    modal.appendChild(img);

    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
}

// این تابع برای بررسی استریک و تنظیم آن برای زمانی که فاصله بیش از 3 روز باشد
function checkStreak() {
    // بررسی اگر تاریخچه خالی بود
    if (studyHistory.length === 0) {
        streakCount = 1; // استریک از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به 1
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی استریک در صفحه
        return;
    }

    const lastStudyDate = new Date(studyHistory[studyHistory.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today - lastStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // محاسبه تعداد روزهای تفاوت

    // اگر فاصله بیش از 3 روز بود، استریک به 0 می‌رود
    if (diffDays > 3) {
        streakCount = 1; // استریک دوباره از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به 1
    }

    // به روز رسانی استریک در صفحه
    updateStreak();
}

function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    if (lastStreakDate !== today) {
        streakCount++; // افزایش استریک
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به‌روزرسانی استریک
    incrementStreakOncePerDay();  // اینجا باید فراخوانی بشه!

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function updateStreak() {
    document.getElementById("streak-count").textContent = streakCount;
}
window.onload = function() {
    // وقتی صفحه لود میشه، مقدار استریک رو به روز کن
    updateStreak();
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به‌روزرسانی استریک
    incrementStreakOncePerDay();  // اینجا باید فراخوانی بشه!

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
// این تابع برای بررسی استریک و تنظیم آن برای زمانی که فاصله بیش از 3 روز باشد
function checkStreak() {
    // بررسی اگر تاریخچه خالی بود
    if (studyHistory.length === 0) {
        streakCount = 1; // استریک از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به 1
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی استریک در صفحه
        return;
    }

    const lastStudyDate = new Date(studyHistory[studyHistory.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today - lastStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // محاسبه تعداد روزهای تفاوت

    // اگر فاصله بیش از 3 روز بود، استریک به 1 می‌رود
    if (diffDays > 3) {
        streakCount = 1; // استریک دوباره از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به 1
    }

    // به روز رسانی استریک در صفحه
    updateStreak();
}
// این تابع برای اطمینان از اینکه استریک فقط یک بار در روز افزایش پیدا کند
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    if (lastStreakDate !== today) {
        // اگر تاریخچه خالی بود یا اولین یادداشت باشد، استریک باید از 1 شروع شود
        if (streakCount === 0) {
            streakCount = 1; // استریک از 1 شروع می‌شود
        } else {
            streakCount++; // در غیر اینصورت استریک یک واحد افزایش می‌یابد
        }
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به‌روزرسانی استریک
    incrementStreakOncePerDay();  // اینجا باید فراخوانی بشه!

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function checkStreak() {
    // اگر تاریخچه خالی است، استریک باید صفر باشد
    if (studyHistory.length === 0) {
        streakCount = 0; // استریک صفر است
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی استریک در صفحه
        return;
    }

    const lastStudyDate = new Date(studyHistory[studyHistory.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today - lastStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // محاسبه تعداد روزهای تفاوت

    // اگر فاصله بیش از 3 روز بود، استریک به صفر می‌رود
    if (diffDays > 3) {
        streakCount = 0; // استریک صفر می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
    }

    // به روز رسانی استریک در صفحه
    updateStreak();
}
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    // اگر تاریخ آخرین استریک با تاریخ امروز متفاوت بود
    if (lastStreakDate !== today) {
        // اگر تاریخچه خالی است، استریک از 1 شروع می‌شود
        if (streakCount === 0) {
            streakCount = 1; // استریک از 1 شروع می‌شود
        } else {
            streakCount++; // در غیر اینصورت استریک یک واحد افزایش می‌یابد
        }
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به‌روزرسانی استریک
    incrementStreakOncePerDay();  // اینجا باید فراخوانی بشه!

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    // اگر تاریخ آخرین استریک با تاریخ امروز متفاوت بود
    if (lastStreakDate !== today) {
        // اگر تاریخچه خالی است یا استریک صفر است، استریک از 1 شروع می‌شود
        if (streakCount === 0) {
            streakCount = 1; // استریک از 1 شروع می‌شود
        } else {
            streakCount++; // در غیر اینصورت استریک یک واحد افزایش می‌یابد
        }
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // به‌روزرسانی استریک
    incrementStreakOncePerDay();  // اینجا باید فراخوانی بشه!

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function checkStreak() {
    // اگر تاریخچه خالی است، استریک باید صفر باشد
    if (studyHistory.length === 0) {
        streakCount = 0; // استریک صفر است
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی استریک در صفحه
        return;
    }

    const lastStudyDate = new Date(studyHistory[studyHistory.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today - lastStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // محاسبه تعداد روزهای تفاوت

    // اگر فاصله بیش از 3 روز بود، استریک به صفر می‌رود
    if (diffDays > 3) {
        streakCount = 0; // استریک صفر می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
    }

    // به روز رسانی استریک در صفحه
    updateStreak();
}
// حذف یک یادداشت خاص از تاریخچه
function deleteStudy(index) {
    // حذف یادداشت از آرایه تاریخچه
    studyHistory.splice(index, 1);

    // اگر تاریخچه خالی شد، استریک باید به صفر برگردد
    if (studyHistory.length === 0) {
        streakCount = 0; // استریک صفر می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
        localStorage.removeItem('lastStreakDate'); // پاک کردن تاریخ آخرین استریک
    } else {
        // اگر تاریخچه خالی نشده است، تاریخ آخرین یادداشت را بروزرسانی می‌کنیم
        localStorage.setItem("studyHistory", JSON.stringify(studyHistory));
    }

    // به روز رسانی تاریخچه نمایش داده شده
    displayHistory();

    // بروزرسانی استریک
    updateStreak();
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // اگر تاریخچه خالی است، استریک باید از 1 شروع شود
    if (studyHistory.length === 1) {
        streakCount = 1; // اولین یادداشت، استریک از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ اولین یادداشت
    } else {
        // به‌روزرسانی استریک
        incrementStreakOncePerDay();
    }

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function checkStreak() {
    // اگر تاریخچه خالی است، استریک باید صفر باشد
    if (studyHistory.length === 0) {
        streakCount = 0; // استریک صفر است
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
        localStorage.removeItem('lastStreakDate'); // پاک کردن تاریخ آخرین استریک
        updateStreak(); // بروزرسانی استریک در صفحه
        return;
    }

    const lastStudyDate = new Date(studyHistory[studyHistory.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today - lastStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // محاسبه تعداد روزهای تفاوت

    // اگر فاصله بیش از 3 روز بود، استریک به صفر می‌رود
    if (diffDays > 3) {
        streakCount = 0; // استریک صفر می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
    }

    // به روز رسانی استریک در صفحه
    updateStreak();
}
function checkStreak() {
    // اگر تاریخچه خالی است، استریک باید صفر باشد
    if (studyHistory.length === 0) {
        streakCount = 0; // استریک صفر است
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی استریک در صفحه
        return;
    }

    const lastStudyDate = new Date(studyHistory[studyHistory.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today - lastStudyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // محاسبه تعداد روزهای تفاوت

    // اگر فاصله بیش از 3 روز بود، استریک به صفر می‌رود
    if (diffDays > 3) {
        streakCount = 0; // استریک صفر می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک به صفر
    }

    // به روز رسانی استریک در صفحه
    updateStreak();
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // اگر تاریخچه خالی است، استریک باید از 1 شروع شود
    if (studyHistory.length === 1) {
        streakCount = 1; // اولین یادداشت، استریک از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ اولین یادداشت
    } else {
        // به‌روزرسانی استریک
        incrementStreakOncePerDay();
    }

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    // اگر تاریخ آخرین استریک با تاریخ امروز متفاوت بود
    if (lastStreakDate !== today) {
        // اگر تاریخچه خالی است یا اولین یادداشت است، استریک از 1 شروع می‌شود
        if (streakCount === 0) {
            streakCount = 1; // استریک از 1 شروع می‌شود
        } else {
            streakCount++; // در غیر اینصورت استریک یک واحد افزایش می‌یابد
        }
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // بررسی اینکه تاریخچه خالی است یا نه
    if (studyHistory.length === 1) {
        // اگر اولین یادداشت است، استریک از 1 شروع می‌شود
        streakCount = 1; // استریک از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ اولین یادداشت
    } else {
        // اگر تاریخچه قبلاً یادداشت داشته باشد، استریک افزایش پیدا می‌کند
        incrementStreakOncePerDay();
    }

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    console.log("تاریخ آخرین استریک:", lastStreakDate);
    console.log("تاریخ امروز:", today);
    console.log("قبل از افزایش: ", streakCount);

    if (lastStreakDate !== today) {
        streakCount++; // افزایش استریک
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه

        console.log("بعد از افزایش:", streakCount);
    }
}
function saveStudy() {
    const studyText = document.getElementById("study-text").value;
    const studyImage = document.getElementById("study-image").files[0];
    const studyVoice = document.getElementById("study-voice").files[0];

    if (studyText.trim() === "" && !studyImage && !studyVoice) {
        alert("لطفاً چیزی بنویسید یا یک فایل آپلود کنید!");
        return;
    }

    // ذخیره یادداشت و فایل‌ها در تاریخچه
    let imageUrl = "";
    let voiceUrl = "";

    if (studyImage) {
        imageUrl = URL.createObjectURL(studyImage);  // تبدیل فایل به URL
    }

    if (studyVoice) {
        voiceUrl = URL.createObjectURL(studyVoice);
    }

    // اضافه کردن یادداشت جدید به تاریخچه
    studyHistory.push({
        date: new Date().toLocaleDateString(),
        text: studyText,
        image: imageUrl,
        voice: voiceUrl
    });

    // ذخیره داده‌ها در localStorage
    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // بررسی اینکه تاریخچه خالی است یا نه
    if (studyHistory.length === 1) {
        // اگر اولین یادداشت است، استریک از 1 شروع می‌شود
        streakCount = 1; // استریک از 1 شروع می‌شود
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک
        localStorage.setItem('lastStreakDate', new Date().toISOString().split('T')[0]); // ذخیره تاریخ اولین یادداشت
    } else {
        // اگر تاریخچه قبلاً یادداشت داشته باشد، استریک افزایش پیدا می‌کند
        incrementStreakOncePerDay();
    }

    // به‌روزرسانی تاریخچه در صفحه
    displayHistory();

    // به‌روزرسانی استریک در صفحه بلافاصله بعد از اضافه کردن یادداشت
    updateStreak();

    // شروع آزمون
    startQuiz();

    // پاک کردن فیلدهای متنی و فایل‌ها بعد از ذخیره
    document.getElementById("study-text").value = "";
    document.getElementById("study-image").value = "";
    document.getElementById("study-voice").value = "";
}

// این تابع استریک را به روز رسانی می‌کند
function updateStreak() {
    document.getElementById("streak-count").textContent = streakCount;
}

// این تابع برای اطمینان از اینکه استریک فقط یک بار در روز افزایش پیدا کند
function incrementStreakOncePerDay() {
    const lastStreakDate = localStorage.getItem('lastStreakDate');
    const today = new Date().toISOString().split('T')[0]; // تاریخ امروز

    if (lastStreakDate !== today) {
        streakCount++; // افزایش استریک
        localStorage.setItem('streakCount', streakCount); // ذخیره استریک جدید
        localStorage.setItem('lastStreakDate', today); // ذخیره تاریخ امروز
        updateStreak(); // بروزرسانی نمایش استریک در صفحه
    }
}
