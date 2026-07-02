/* ======================================================
   心记 · 每日日记 — 完整应用逻辑
   ====================================================== */

(function () {
    'use strict';

    // ======================================================
    // 1. 数据存储模块 (localStorage)
    // ======================================================
    const Storage = {
        _key: 'xinji_data',

        _load() {
            try {
                const raw = localStorage.getItem(this._key);
                return raw ? JSON.parse(raw) : { entries: {}, weeklyStrengths: {}, coachingReports: {} };
            } catch { return { entries: {}, weeklyStrengths: {}, coachingReports: {} }; }
        },

        _save(data) {
            localStorage.setItem(this._key, JSON.stringify(data));
        },

        // 某天的所有日记
        getEntries(dateStr) {
            const data = this._load();
            return data.entries[dateStr] || [];
        },

        // 保存一条日记
        saveEntry(entry) {
            const data = this._load();
            const dateStr = entry.date;
            if (!data.entries[dateStr]) data.entries[dateStr] = [];
            // 当天已有则替换，否则追加
            const idx = data.entries[dateStr].findIndex(e => e.id === entry.id);
            if (idx >= 0) data.entries[dateStr][idx] = entry;
            else data.entries[dateStr].push(entry);
            this._save(data);
            return entry;
        },

        // 删除一条日记
        deleteEntry(dateStr, id) {
            const data = this._load();
            if (data.entries[dateStr]) {
                data.entries[dateStr] = data.entries[dateStr].filter(e => e.id !== id);
                if (data.entries[dateStr].length === 0) delete data.entries[dateStr];
            }
            this._save(data);
        },

        // 获取日期范围内的所有日记
        getEntriesInRange(startDate, endDate) {
            const data = this._load();
            const result = [];
            const d = new Date(startDate);
            const end = new Date(endDate);
            while (d <= end) {
                const key = d.toISOString().slice(0, 10);
                if (data.entries[key]) result.push(...data.entries[key]);
                d.setDate(d.getDate() + 1);
            }
            return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        },

        // 获取某一天的 ISO 日期字符串
        getLastNDays(n) {
            const d = new Date();
            d.setDate(d.getDate() - n);
            return d.toISOString().slice(0, 10);
        },

        // 获取本周的所有日记
        getWeekEntries(year, weekNum) {
            const start = this._weekStart(year, weekNum);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return this.getEntriesInRange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
        },

        // 获取双周的所有日记
        getBiWeekEntries(year, startMonth, startDay) {
            const start = new Date(year, startMonth, startDay);
            const end = new Date(start);
            end.setDate(end.getDate() + 13);
            return this.getEntriesInRange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
        },

        // 计算周一开始时间
        _weekStart(year, weekNum) {
            const jan1 = new Date(year, 0, 1);
            const day = jan1.getDay() || 7;
            const diff = (weekNum - 1) * 7 + (1 - day);
            const start = new Date(year, 0, 1 + diff);
            return start;
        },

        // 获取当前 ISO 周数
        getWeekNumber(d) {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        },

        // 获取当前双周区间
        getBiWeekPeriod(date) {
            const d = date || new Date();
            const year = d.getFullYear();
            const startOfYear = new Date(year, 0, 1);
            const dayOfYear = Math.floor((d - startOfYear) / 86400000);
            const period = Math.floor(dayOfYear / 14);
            const periodStart = new Date(year, 0, 1 + period * 14);
            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + 13);
            return {
                start: periodStart.toISOString().slice(0, 10),
                end: periodEnd.toISOString().slice(0, 10),
                label: `${periodStart.getMonth()+1}月${periodStart.getDate()}日 - ${periodEnd.getMonth()+1}月${periodEnd.getDate()}日`,
                key: periodStart.toISOString().slice(0, 10)
            };
        },

        // 保存每周优势分析
        saveWeeklyStrength(weekKey, data) {
            const store = this._load();
            store.weeklyStrengths[weekKey] = data;
            this._save(store);
        },

        // 获取每周优势分析
        getWeeklyStrength(weekKey) {
            const store = this._load();
            return store.weeklyStrengths[weekKey] || null;
        },

        // 保存教练报告
        saveCoachingReport(periodKey, data) {
            const store = this._load();
            store.coachingReports[periodKey] = data;
            this._save(store);
        },

        // 获取教练报告
        getCoachingReport(periodKey) {
            const store = this._load();
            return store.coachingReports[periodKey] || null;
        },

        // 统计连续写作天数
        calcStreak() {
            const data = this._load();
            const dates = Object.keys(data.entries).sort().reverse();
            if (dates.length === 0) return 0;
            let streak = 0;
            const today = new Date().toISOString().slice(0, 10);
            // 从今天或昨天开始算
            const checkDate = new Date(today);
            // 如果今天还没写，从昨天开始算
            if (!data.entries[today]) checkDate.setDate(checkDate.getDate() - 1);
            const checkStr = checkDate.toISOString().slice(0, 10);
            for (let i = 0; i < 365; i++) {
                const d = new Date(checkStr);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                if (data.entries[key]) streak++;
                else break;
            }
            return streak;
        },

        // 导出所有数据
        exportAll() {
            return this._load();
        }
    };

    // ======================================================
    // 2. 语音输入模块
    // ======================================================
    const VoiceInput = {
        recognition: null,
        isListening: false,
        onResult: null,
        onEnd: null,

        init() {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) return false;
            this.recognition = new SR();
            this.recognition.lang = 'zh-CN';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;

            this.recognition.onresult = (e) => {
                let transcript = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    transcript += e.results[i][0].transcript;
                }
                if (this.onResult) this.onResult(transcript, e.results[e.results.length - 1].isFinal);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onEnd) this.onEnd();
            };

            this.recognition.onerror = (e) => {
                console.warn('语音识别错误:', e.error);
                this.isListening = false;
                if (this.onEnd) this.onEnd();
            };
            return true;
        },

        start() {
            if (!this.recognition) {
                if (!this.init()) return false;
            }
            try {
                this.recognition.start();
                this.isListening = true;
                return true;
            } catch (e) {
                console.warn('语音启动失败:', e);
                return false;
            }
        },

        stop() {
            if (this.recognition && this.isListening) {
                this.recognition.stop();
                this.isListening = false;
            }
        },

        supported() {
            return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        }
    };

    // ======================================================
    // 3. 引导写作模块
    // ======================================================
    const GuidedMode = {
        questions: [
            {
                id: 'weather',
                text: '今天是什么日子？',
                hint: '记录今天的日期、星期和天气，帮锚定这一天的坐标'
            },
            {
                id: 'focus',
                text: '今天你主要在忙什么？',
                hint: '工作、学习、生活——回顾今天的主要活动'
            },
            {
                id: 'highlight',
                text: '今天有什么特别的事情发生吗？',
                hint: '开心的事、烦恼的事、让你印象深刻的事，哪怕很小'
            },
            {
                id: 'scene',
                text: '这件事发生在什么场景？',
                hint: '什么时间？在哪里？和谁在一起？还原当时的画面'
            },
            {
                id: 'emotion',
                text: '当时你有什么感觉？',
                hint: '开心、焦虑、平静、愤怒？试着描述那种情绪'
            },
            {
                id: 'reflection',
                text: '现在回想起来，感受有什么变化吗？',
                hint: '重新审视当时的事，有没有新的视角或领悟'
            },
            {
                id: 'gratitude',
                text: '今天有什么想感谢的人或事吗？',
                hint: '哪怕是一杯好咖啡、一句暖心的话'
            },
            {
                id: 'tomorrow',
                text: '对明天有什么期待或计划？',
                hint: '一个小小的目标或愿望都可以'
            }
        ],

        currentIndex: 0,
        answers: {},
        onComplete: null,

        start(onComplete) {
            this.currentIndex = 0;
            this.answers = {};
            this.onComplete = onComplete;
            this._showQuestion();
        },

        _showQuestion() {
            const q = this.questions[this.currentIndex];
            document.getElementById('guided-question').innerHTML =
                `${q.text} <span class="hint">${q.hint}</span>`;
            document.getElementById('guided-answer').value = this.answers[q.id] || '';
            document.getElementById('guided-answer').focus();

            // 更新进度
            const total = this.questions.length;
            const prog = ((this.currentIndex + 1) / total) * 100;
            document.getElementById('guided-progress-text').textContent =
                `${this.currentIndex + 1} / ${total}`;
            document.getElementById('guided-progress-bar').style.width = `${prog}%`;

            // 按钮状态
            document.getElementById('guided-prev').disabled = this.currentIndex === 0;
            const nextBtn = document.getElementById('guided-next');
            if (this.currentIndex === total - 1) {
                nextBtn.innerHTML = '完成';
            } else {
                nextBtn.innerHTML = '下一步';
            }
        },

        next() {
            const q = this.questions[this.currentIndex];
            const answer = document.getElementById('guided-answer').value.trim();
            if (answer) this.answers[q.id] = answer;

            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                this._showQuestion();
            } else {
                this._finish();
            }
        },

        prev() {
            // 保存当前答案
            const q = this.questions[this.currentIndex];
            const answer = document.getElementById('guided-answer').value.trim();
            if (answer) this.answers[q.id] = answer;

            if (this.currentIndex > 0) {
                this.currentIndex--;
                this._showQuestion();
            }
        },

        skip() {
            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                this._showQuestion();
            } else {
                this._finish();
            }
        },

        _finish() {
            // 编译成日记格式
            const a = this.answers;
            const now = new Date();
            const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
            const weekday = weekdays[now.getDay()];
            const weatherStr = a.weather || '';

            const parts = [];
            parts.push(`${dateStr}，${weekday}${weatherStr ? '，' + weatherStr : ''}。\n`);
            if (a.focus) parts.push(`\n今天主要在忙${a.focus}。`);
            if (a.highlight) parts.push(`其中让我印象最深的是：${a.highlight}。`);
            if (a.scene) parts.push(`\n${a.scene}。`);
            if (a.emotion) parts.push(`当时我感到${a.emotion}。`);
            if (a.reflection) parts.push(`现在回想起来，${a.reflection}。`);
            if (a.gratitude) parts.push(`\n今天想感谢：${a.gratitude}。`);
            if (a.tomorrow) parts.push(`\n期待明天：${a.tomorrow}。`);

            const content = parts.join('\n');

            if (this.onComplete) {
                this.onComplete(content);
            }
        }
    };

    // ======================================================
    // 4. 分析引擎
    // ======================================================
    const Analysis = {
        // ---- 优势词库 ----
        _strengthKeywords: [
            { word: '帮助|帮了|支持|陪伴|倾听|安慰', name: '同理心与关爱', icon: '💛',
              detail: '你善于感知他人的情绪和需求，愿意为身边的人提供支持。' },
            { word: '完成|搞定|坚持|做到|达成|实现了|成功|突破', name: '执行力与韧性', icon: '💪',
              detail: '你有很强的行动力，能够把想法转化为现实，面对困难不轻易放弃。' },
            { word: '学到了|发现|搞懂|研究|阅读|思考|反思', name: '学习力与好奇心', icon: '📚',
              detail: '你对新知识保持开放，善于从经历中提炼经验，不断自我进化。' },
            { word: '计划|安排|整理|规划|梳理|清单', name: '规划与条理性', icon: '📋',
              detail: '你习惯把事情安排得井井有条，善于统筹和管理时间。' },
            { word: '沟通|说了|聊了|讨论|商量|建议|分享|表达', name: '沟通与表达', icon: '💬',
              detail: '你善于用语言表达想法，在交流和协作中展现出清晰和温度。' },
            { word: '解决|处理|应对|想办法|优化|改善', name: '问题解决能力', icon: '🔧',
              detail: '面对问题你倾向于主动寻找方案，而不是被动等待。' },
            { word: '创新|创意|设计|灵感|想到新|尝试', name: '创造力与创新', icon: '✨',
              detail: '你经常有新的想法和创意，敢于尝试不同的做法。' },
            { word: '领导|组织|带队|负责|安排大家|主导', name: '领导力与担当', icon: '👑',
              detail: '你愿意承担责任，能够带领团队朝着目标前进。' },
            { word: '开心|快乐|感激|感恩|满足|幸福|喜悦', name: '积极情绪与感恩', icon: '🌞',
              detail: '你善于发现生活中的美好，保持积极的心态面对每一天。' },
            { word: '勇敢|直面|不怕|挑战|冒险|突破', name: '勇气与冒险精神', icon: '🔥',
              detail: '面对未知和挑战，你敢于迈出舒适区，迎难而上。' },
            { word: '耐心|等|慢慢|倾听|理解|包容', name: '耐心与包容', icon: '🧘',
              detail: '你懂得等待和倾听，给他人和自己留有空间和余地。' },
            { word: '合作|一起|团队|配合|共同', name: '协作精神', icon: '🤝',
              detail: '你重视团队合作，善于与他人配合达到共同目标。' }
        ],

        // ---- 待优化模式词库 ----
        _improveKeywords: [
            { word: '拖延|迟迟|不想动|懒得|耽误|赶时间', name: '拖延与行动延迟',
              detail: '有些事情迟迟没有开始，可能需要先找到启动的最小动作。' },
            { word: '焦虑|担心|害怕|紧张|不安|压力大|慌', name: '焦虑与过度担忧',
              detail: '对未来的不确定性感到紧张，可能需要区分可控和不可控因素。' },
            { word: '冲突|争吵|生气|不爽|委屈|失望', name: '人际关系摩擦',
              detail: '在沟通中遇到了情绪碰撞，可能需要更清晰的表达或边界。' },
            { word: '没动力|迷茫|不知道|空虚|没劲|疲惫', name: '动力不足与迷茫',
              detail: '暂时失去了方向感或能量，休息和自我对话可能比硬撑更有效。' },
            { word: '完美主义|不够好|还不够|不满意|重新来', name: '完美主义倾向',
              detail: '对自己要求过高，容易陷入"不够好"的循环，完成比完美更重要。' },
            { word: '熬夜|睡不好|失眠|累|疲劳', name: '作息与精力管理',
              detail: '作息不规律会影响第二天的状态，固定的睡前仪式可能有帮助。' },
            { word: '分心|刷手机|走神|不专注|效率低', name: '注意力分散',
              detail: '容易被外界干扰打断，番茄工作法可能适合你。' }
        ],

        // ---- 计算某周的优势分析 ----
        analyzeWeek(entries) {
            if (!entries || entries.length === 0) return null;

            const allText = entries.map(e => e.content || '').join('\n');
            const allGuided = entries.map(e => e.guidedAnswers || {}).reduce((a, b) => Object.assign(a, b), {});

            // 统计优势关键词
            const strengthHits = {};
            this._strengthKeywords.forEach(sk => {
                const regex = new RegExp(sk.word, 'gi');
                const matches = allText.match(regex);
                if (matches) {
                    strengthHits[sk.name] = {
                        count: matches.length,
                        icon: sk.icon,
                        detail: sk.detail,
                        evidence: this._extractEvidence(allText, sk.word)
                    };
                }
            });

            // 排序取前3
            const sortedStrengths = Object.entries(strengthHits)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 3)
                .map(([name, data]) => ({ name, ...data }));

            // 发现潜在优势（计数在1-2之间的优势，可能是尚未被充分识别的）
            const potentialStrengths = Object.entries(strengthHits)
                .filter(([name, data]) => data.count <= 2 && data.count >= 1)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 2);

            // 合成隐藏优势描述
            const hiddenStrengths = potentialStrengths.map(([name, data]) => {
                const desc = `本周观察到你有「${name}」的表现——${data.detail}`;
                const evidence = data.evidence.length > 0
                    ? `例：${data.evidence[0]}`
                    : '这可能是你尚未充分意识到的特质，值得在日常中有意识地发挥。';
                return `${desc}\n${evidence}`;
            });

            // 默认隐藏优势（如果没有找到）
            if (hiddenStrengths.length === 0) {
                const defaultStrengths = this._strengthKeywords
                    .filter(sk => !strengthHits[sk.name])
                    .slice(0, 2);
                defaultStrengths.forEach(sk => {
                    hiddenStrengths.push(
                        `潜在优势可能在于「${sk.name}」。本周记录中尚未充分体现这一特质，${sk.detail}可以尝试在日常中有意识地留意和发挥。`
                    );
                });
            }

            // 统计情绪分布
            const moodCounts = { great: 0, good: 0, okay: 0, bad: 0, terrible: 0 };
            entries.forEach(e => { if (e.mood && moodCounts[e.mood] !== undefined) moodCounts[e.mood]++; });
            const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
            const moodLabels = { great: '积极充实', good: '平稳愉快', okay: '一般般', bad: '低落', terrible: '很差' };

            return {
                weekLabel: this._formatWeekLabel(entries),
                entryCount: entries.length,
                dominantMood: moodLabels[dominantMood] || '未知',
                strengths: sortedStrengths.length > 0 ? sortedStrengths : [{ name: '正在积累中', icon: '🌱', detail: '日记数据尚少，继续坚持记录会得到更精准的分析', count: 0 }],
                hiddenStrengths: hiddenStrengths,
                moodDistribution: moodCounts
            };
        },

        // ---- 双周教练分析 ----
        analyzeBiWeek(entries) {
            if (!entries || entries.length < 3) return null; // 至少3天数据

            const allText = entries.map(e => e.content || '').join('\n');
            const entryCount = entries.length;

            // 1. 分析正向和待优化模式
            const strengthMatches = {};
            this._strengthKeywords.forEach(sk => {
                const regex = new RegExp(sk.word, 'gi');
                const matches = allText.match(regex);
                if (matches) strengthMatches[sk.name] = { count: matches.length, icon: sk.icon, detail: sk.detail };
            });

            const improveMatches = {};
            this._improveKeywords.forEach(ik => {
                const regex = new RegExp(ik.word, 'gi');
                const matches = allText.match(regex);
                if (matches) improveMatches[ik.name] = { count: matches.length, detail: ik.detail };
            });

            // 排序取优势 top-2
            const topStrengths = Object.entries(strengthMatches)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 2);

            // 排序取待优化 top-1
            const topImproves = Object.entries(improveMatches)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 1);

            // 正向行为模式描述
            const positivePatterns = topStrengths.length > 0
                ? topStrengths.map(([name, data]) => ({
                    name,
                    icon: data.icon,
                    desc: `你在这两周中多次展现出「${name}」的行为模式。${data.detail}这说明这是你相对稳定的内在优势，在合适的场景下可以进一步放大。`,
                    occurrences: data.count
                }))
                : [{ name: '持续记录中', icon: '📝', desc: '继续坚持写日记，系统将识别你的正向行为模式。', occurrences: 0 }];

            // 待优化模式描述
            const improvePatterns = topImproves.length > 0
                ? topImproves.map(([name, data]) => ({
                    name,
                    desc: `你在日记中反复提到「${name}」相关的困扰。${data.detail}值得关注的是，意识到这一点本身就是改变的开始。`,
                    occurrences: data.count
                }))
                : [{ name: '暂无明确待优化模式', desc: '这两周的状态比较平稳，可以在下一个周期继续关注。', occurrences: 0 }];

            // 2. 卡点深挖 & 优势复用场景
            const cardPoint = topImproves.length > 0
                ? {
                    title: topImproves[0][0],
                    deepDive: this._generateDeepDive(topImproves[0][0], topImproves[0][1].detail, allText),
                    reuseScenarios: topStrengths.length > 0
                        ? this._generateReuseScenarios(topStrengths.map(s => s[0]))
                        : ['在日常工作中主动寻找可以发挥你特长的方式。']
                  }
                : {
                    title: '当前周期暂无明显卡点',
                    deepDive: '这双周你的整体状态较为平稳，继续保持日志记录有助于在未来的周期中发现有意义的模式。',
                    reuseScenarios: ['持续记录，定期复盘，不断放大你已经做对的事情。']
                  };

            // 3. 行动计划
            const actionPlans = this._generateActionPlans(
                topImproves.map(s => s[0]),
                topStrengths.map(s => ({ name: s[0], icon: s[1].icon }))
            );

            return {
                periodLabel: this._getBiWeekLabel(entries),
                entryCount: entryCount,
                positivePatterns,
                improvePatterns,
                cardPoint,
                actionPlans,
                summary_sample: allText.slice(0, 50)
            };
        },

        // ---- 辅助方法 ----
        _extractEvidence(text, keywordPattern) {
            const regex = new RegExp(`[^。！？]*?${keywordPattern}[^。！？]*[。！？]`, 'gi');
            const matches = text.match(regex);
            if (!matches) return [];
            return matches.slice(0, 3).map(m => m.trim());
        },

        _formatWeekLabel(entries) {
            if (entries.length === 0) return '本周';
            const dates = entries.map(e => e.date).sort();
            return `${dates[0]} ~ ${dates[dates.length - 1]}`;
        },

        _getBiWeekLabel(entries) {
            if (entries.length === 0) return '双周';
            const dates = entries.map(e => e.date).sort();
            const s = new Date(dates[0]);
            const e = new Date(dates[dates.length - 1]);
            return `${s.getMonth()+1}月${s.getDate()}日 - ${e.getMonth()+1}月${e.getDate()}日 (${entries.length}篇)`;
        },

        _generateDeepDive(issueName, issueDetail, allText) {
            const deepDives = {
                '拖延与行动延迟': '拖延往往不是懒惰，而是对任务难度或结果的恐惧在潜意识中作祟。你可能在等待"完美时机"或"充足准备"——但事实上，启动本身才是破除拖延的关键。建议在日常中留意：你拖延的事情是否都有"必须做到完美"的共同特征？如果是，试着把标准从"完美"降到"完成"。',
                '焦虑与过度担忧': '焦虑的本质是对未来的不确定性的过度关注。你的大脑试图通过"提前担忧"来获得控制感，但往往消耗了本应用于行动的精力。值得区分的是：哪些是你真正能控制的，哪些是即使焦虑也无法改变的。把你的心力放在可控的那一部分上。',
                '人际关系摩擦': '摩擦背后通常藏着未被满足的期待或未被表达的边界。你可能习惯性把事情往心里放，等到积累到一定程度才爆发。试着在日常中练习"小剂量表达"——在感到不舒服的当下就用温和的方式说出来。',
                '动力不足与迷茫': '迷茫不是方向感的缺失，而是信号在提醒你需要重新连接内心真正的渴望。这段时间可能是转型期的正常状态。不用急着找到"正确答案"，多给自己一些空白时间去感受真正让你有热情的事。',
                '完美主义倾向': '完美主义的背面是对失败的强烈恐惧。你能看到"更好的可能性"是天赋，但"足够好"比"完美"更能推动进步。尝试给自己设定"最低可行标准"——只要达到就庆祝完成，剩下的迭代交给过程。',
                '作息与精力管理': '作息混乱往往是心理状态的一面镜子。熬夜可能是在用安静的时间寻找"属于自己的时间"。但这会形成恶性循环。试着建立一个小小的睡前仪式，哪怕是睡前10分钟不看屏幕，用纸质书或冥想代替。',
                '注意力分散': '注意力分散不是你不够自律，而是环境设计和习惯共同作用的结果。你的大脑天生容易被新鲜事物吸引。尝试用外部约束来保护注意力：工作时把手机放远、使用番茄钟、在固定的时间段处理消息。'
            };
            return deepDives[issueName] || `「${issueName}」是你在这双周中反复遇到的模式。${issueDetail}建议从最小的改变开始——每天在日记中记录一件相关的小进步或小尝试。`;
        },

        _generateReuseScenarios(strengthNames) {
            const scenarios = {
                '同理心与关爱': '在团队协作或亲友关系中主动倾听和回应，尤其是对方表达脆弱时。可以尝试每周安排一次深度对话。',
                '执行力与韧性': '适合承担需要长期推进的项目或习惯养成计划。把你的行动力用在对长期目标有积累的事情上。',
                '学习力与好奇心': '适合在知识型领域深耕，每周安排固定的学习时间，并输出笔记分享给他人。',
                '规划与条理性': '适合负责复杂的多线程任务或活动策划。你的组织能力在需要统筹多方资源时最亮眼。',
                '沟通与表达': '在会议、演讲、写作等场景中发挥优势。考虑定期写总结或心得分享。',
                '问题解决能力': '适合在遇到突发状况时作为核心处理者。你的冷静分析能力在压力环境下尤其可贵。',
                '创造力与创新': '适合参加头脑风暴、产品设计等需要新视角的工作。可以每周留出自由探索的时间。',
                '领导力与担当': '适合主动承担项目负责人或团队协调角色。你的责任感让他人愿意追随。',
                '积极情绪与感恩': '在团队中能带来正向氛围。适合在压力环境中做"情绪稳定器"，也适合从事需要感染力的工作。',
                '勇气与冒险精神': '适合在需要开拓新方向或突破常规时主动请缨。你的勇气是团队打破僵局的重要资源。',
                '耐心与包容': '适合处理需要长期投入和反复沟通的事，如教学、辅导、客户关系维护。',
                '协作精神': '适合跨部门协作或团队项目。你的合作意识能有效减少内耗，提升团队效率。'
            };

            return strengthNames.map(n => scenarios[n] || `${n}——在你的日常场景中继续有意识地放大这一特质。`);
        },

        _generateActionPlans(improveNames, topStrengths) {
            const plans = [];

            // 计划1：改卡点（针对最突出的待优化项）
            if (improveNames.length > 0) {
                const issue = improveNames[0];
                const fixPlans = {
                    '拖延与行动延迟': {
                        title: '「5分钟启动法」',
                        desc: '每天早晨选定一件最不想做的事，设置5分钟计时器，告诉自己"只做5分钟"。通常一旦开始，就停不下来了。坚持一周，记录启动后实际花费的时间。'
                    },
                    '焦虑与过度担忧': {
                        title: '「焦虑清单」练习',
                        desc: '每天花3分钟写下所有让你焦虑的事，然后逐一标注：哪些是你能控制的（划入"行动区"），哪些是不能控制的（划入"释放区"）。只对"行动区"的事项制定下一步动作。'
                    },
                    '人际关系摩擦': {
                        title: '「小剂量表达」挑战',
                        desc: '当感到不舒服或有不同意见时，在当天内用温和的方式表达出来。句式参考："我感觉到……，我的理解是……，想和你确认一下。"每周至少练习3次。'
                    },
                    '动力不足与迷茫': {
                        title: '「能量日志」实验',
                        desc: '连续7天，每天记录三件事：①今天最有能量是什么时候？②做了什么？③这件事给了你什么感受？周末回顾，找出你的能量来源模式。'
                    },
                    '完美主义倾向': {
                        title: '「完成仪式」训练',
                        desc: '每完成一件事（无论是否完美），对自己说一句"这已经足够了"并记录完成的事实。设定每周3个小目标，每个目标只要求"做完"不问"做好"。'
                    },
                    '作息与精力管理': {
                        title: '「日落仪式」计划',
                        desc: '睡前1小时开始"降速"：①关掉所有电子屏幕 ②做一件低刺激的事（阅读/拉伸/写日记）③固定上床时间。先坚持5天，记录每天的精神状态变化。'
                    },
                    '注意力分散': {
                        title: '「45分钟专注块」',
                        desc: '每天安排2-3个45分钟的"专注块"，期间手机静音、关闭通知、只做一件事。两个专注块之间休息10分钟。执行时用纸笔记下任何分心的念头，结束后再处理。'
                    }
                };
                const plan = fixPlans[issue] || {
                    title: `关注「${issue}」的最小改变`,
                    desc: '从每天做一件相关的小事开始，记录过程中的感受和发现，下周再复盘调整。'
                };
                plans.push({
                    type: '改卡点',
                    icon: '🎯',
                    badge: 'badge-improve',
                    ...plan
                });
            } else {
                plans.push({
                    type: '改卡点',
                    icon: '🎯',
                    badge: 'badge-improve',
                    title: '持续自我觉察',
                    desc: '当前未发现显著的待优化模式。继续保持日记习惯，下一个双周期进一步深入自我认知。'
                });
            }

            // 计划2：放大优势1
            if (topStrengths.length > 0) {
                const s = topStrengths[0];
                const ampPlans = {
                    '同理心与关爱': {
                        title: '每周一次深度倾听',
                        desc: '每周主动找一位朋友或同事，花30分钟纯倾听——不打断、不建议、不评判，只提问和理解。结束后记录对方的反馈和自己的感受。'
                    },
                    '执行力与韧性': {
                        title: '设置一个「挑战项目」',
                        desc: '选择一件有难度但你想完成的事（如学习一项新技能、完成一个个人项目），设定21天计划，每天推进一点。在日记中记录进展和阻力。'
                    },
                    '学习力与好奇心': {
                        title: '「每周一学」输出计划',
                        desc: '每周花2小时深入学一个你感兴趣的话题，然后写一篇300字的学习笔记或画一张知识卡片。持续积累，形成你的知识体系。'
                    },
                    '创造力与创新': {
                        title: '「自由创作时间」',
                        desc: '每周预留2小时完全自由的创作时间，不受任何限制地写、画、设计或构思。记录涌现的想法，即使看起来不切实际。'
                    }
                };
                const ampPlan = ampPlans[s.name] || {
                    title: `放大「${s.name}」优势`,
                    desc: `在接下来的两周中，有意识地创造场景发挥你的「${s.name}」特质，并在日记中记录具体效果。`
                };
                plans.push({
                    type: '放大优势',
                    icon: '🚀',
                    badge: 'badge-positive',
                    ...ampPlan
                });
            } else {
                plans.push({
                    type: '放大优势',
                    icon: '🚀',
                    badge: 'badge-positive',
                    title: '发现你的优势模式',
                    desc: '坚持写日记，在每周优势库中关注系统识别出的优势，并在实际生活中有意识地验证和放大。'
                });
            }

            // 计划3：放大优势2
            if (topStrengths.length > 1) {
                const s = topStrengths[1];
                const ampPlans = {
                    '规划与条理性': {
                        title: '升级你的系统',
                        desc: '把你已经在用的清单/规划方法体系化，尝试用GTD或子弹笔记等方法论优化现有流程，记录效率变化。'
                    },
                    '沟通与表达': {
                        title: '启动输出计划',
                        desc: '定期在社交媒体或团队内分享你的思考和发现，可以是周记、复盘或行业观察。先定一个小目标：每两周发一篇。'
                    },
                    '问题解决能力': {
                        title: '成为「问题猎人」',
                        desc: '主动关注工作或生活中低效的环节，记录问题并思考优化方案。每周至少发现一个问题并提出一个可落地的改进建议。'
                    }
                };
                const ampPlan = ampPlans[s.name] || {
                    title: `发挥「${s.name}」的杠杆效应`,
                    desc: `找到能让你的「${s.name}」产生更大影响力的场景。例如：在团队中主动承担与这一优势匹配的任务。`
                };
                plans.push({
                    type: '放大优势',
                    icon: '🚀',
                    badge: 'badge-positive',
                    ...ampPlan
                });
            } else if (topStrengths.length === 1) {
                plans.push({
                    type: '放大优势',
                    icon: '🚀',
                    badge: 'badge-positive',
                    title: '拓展优势应用场景',
                    desc: `除了已有场景，思考「${topStrengths[0].name}」还能在哪些新领域发挥作用？尝试在不同的环境中应用这一优势。`
                });
            } else {
                plans.push({
                    type: '放大优势',
                    icon: '🚀',
                    badge: 'badge-positive',
                    title: '探索你的隐藏优势',
                    desc: '尝试做一些你平时不太做但有兴趣的事，记录过程中的感受和反馈。新的优势往往藏在新的尝试中。'
                });
            }

            return plans;
        }
    };

    // ======================================================
    // 5. 应用主控制器
    // ======================================================
    const App = {
        currentTab: 'write',
        currentMood: null,
        historyOffset: 0,
        weekOffset: 0,
        coachOffset: 0,

        init() {
            this._bindEvents();
            this._updateOgUrl();
            this._updateHeader();
            this._loadTodayEntry();
            this._updateHistory();
            this._updateWeekly();
            this._updateCoaching();
            // 显示分享按钮（仅在 HTTPS 或 localhost 时）
            if (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                document.getElementById('btn-share').style.display = 'flex';
            }
        },

        _bindEvents() {
            // ---- 底部导航 ----
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
            });

            // ---- 引导写作 ----
            document.getElementById('btn-guided').addEventListener('click', () => {
                document.getElementById('guided-modal').classList.remove('hidden');
                GuidedMode.start((content) => {
                    document.getElementById('guided-modal').classList.add('hidden');
                    document.getElementById('diary-input').value = content;
                    this._updateCharCount();
                    this._showToast('引导完成，日记已为你整理好');
                });
            });

            document.getElementById('guided-next').addEventListener('click', () => GuidedMode.next());
            document.getElementById('guided-prev').addEventListener('click', () => GuidedMode.prev());
            document.getElementById('guided-skip').addEventListener('click', () => GuidedMode.skip());
            document.getElementById('guided-modal').querySelector('.modal-overlay').addEventListener('click', () => {
                document.getElementById('guided-modal').classList.add('hidden');
            });
            document.getElementById('guided-answer').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    GuidedMode.next();
                }
            });

            // ---- 语音输入 ----
            const voiceBtn = document.getElementById('btn-voice');
            voiceBtn.addEventListener('click', () => {
                if (VoiceInput.isListening) {
                    VoiceInput.stop();
                    voiceBtn.classList.remove('active');
                    document.getElementById('voice-indicator').classList.add('hidden');
                    return;
                }
                if (!VoiceInput.supported()) {
                    this._showToast('抱歉，当前浏览器不支持语音输入，建议使用 Chrome');
                    return;
                }
                const textarea = document.getElementById('diary-input');
                VoiceInput.onResult = (transcript, isFinal) => {
                    if (isFinal) {
                        textarea.value += transcript;
                        this._updateCharCount();
                    }
                };
                VoiceInput.onEnd = () => {
                    voiceBtn.classList.remove('active');
                    document.getElementById('voice-indicator').classList.add('hidden');
                    VoiceInput.isListening = false;
                };
                if (VoiceInput.start()) {
                    voiceBtn.classList.add('active');
                    document.getElementById('voice-indicator').classList.remove('hidden');
                } else {
                    this._showToast('语音启动失败，请检查麦克风权限');
                }
            });

            // ---- 情绪选择 ----
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.currentMood = btn.dataset.mood;
                    this._applyMoodTheme(btn.dataset.mood);
                });
            });

            // ---- 字数统计 ----
            document.getElementById('diary-input').addEventListener('input', () => this._updateCharCount());

            // ---- 保存日记 ----
            document.getElementById('btn-save').addEventListener('click', () => this._saveCurrentEntry());

            // ---- 历史导航 ----
            document.getElementById('hist-prev').addEventListener('click', () => { this.historyOffset++; this._updateHistory(); });
            document.getElementById('hist-next').addEventListener('click', () => { if (this.historyOffset > 0) { this.historyOffset--; this._updateHistory(); } });

            // ---- 周导航 ----
            document.getElementById('week-prev').addEventListener('click', () => { this.weekOffset--; this._updateWeekly(); });
            document.getElementById('week-next').addEventListener('click', () => { if (this.weekOffset < 0) { this.weekOffset++; this._updateWeekly(); } });

            // ---- 教练导航 ----
            document.getElementById('coach-prev').addEventListener('click', () => { this.coachOffset--; this._updateCoaching(); });
            document.getElementById('coach-next').addEventListener('click', () => { if (this.coachOffset < 0) { this.coachOffset++; this._updateCoaching(); } });

            // ---- 生成教练报告 ----
            document.getElementById('btn-analyze').addEventListener('click', () => this._generateCoachingReport());

            // ---- 详情弹窗关闭 ----
            document.getElementById('detail-close').addEventListener('click', () => {
                document.getElementById('detail-modal').classList.add('hidden');
            });
            document.getElementById('card-close-btn').addEventListener('click', () => this._dismissDailyCard());
            document.getElementById('daily-card-modal').querySelector('.modal-overlay').addEventListener('click', () => this._dismissDailyCard());

            document.getElementById('detail-modal').querySelector('.modal-overlay').addEventListener('click', () => {
                document.getElementById('detail-modal').classList.add('hidden');
            });

            // ---- 分享应用 ----
            document.getElementById('btn-share').addEventListener('click', () => this._handleShareApp());
            // ---- 数据导出 ----
            document.getElementById('btn-export').addEventListener('click', () => this._handleExport());
            // ---- 数据导入 ----
            document.getElementById('import-file').addEventListener('change', (e) => this._handleImport(e));
            document.getElementById('btn-import').addEventListener('click', () => {
                document.getElementById('import-file').click();
            });
            // ---- 分享单篇日记 ----
            document.getElementById('btn-share-entry').addEventListener('click', () => {
                if (this._currentEntry) this._handleShareEntry(this._currentEntry);
            });
            // ---- 删除单篇日记 ----
            document.getElementById('btn-delete-entry').addEventListener('click', () => {
                if (this._currentEntry) this._handleDeleteEntry(this._currentEntry);
            });
        },

        _switchTab(tab) {
            this.currentTab = tab;
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${tab}`).classList.add('active');
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');

            if (tab === 'history') this._updateHistory();
            if (tab === 'weekly') this._updateWeekly();
            if (tab === 'coaching') this._updateCoaching();
        },

        _updateHeader() {
            const now = new Date();
            const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
            document.getElementById('header-date').textContent =
                `${now.getMonth()+1}/${now.getDate()} ${weekdays[now.getDay()]}`;
            const streak = Storage.calcStreak();
            document.getElementById('header-streak').textContent = streak > 0 ? `🔥 连写${streak}天` : '';
        },

        _updateCharCount() {
            const text = document.getElementById('diary-input').value;
            const count = text.replace(/\s/g, '').length;
            document.getElementById('char-count').textContent = `${count} 字`;
        },

        _loadTodayEntry() {
            const today = new Date().toISOString().slice(0, 10);
            const entries = Storage.getEntries(today);
            if (entries.length > 0) {
                const last = entries[entries.length - 1];
                document.getElementById('diary-input').value = last.content || '';
                this._updateCharCount();
                if (last.mood) {
                    this.currentMood = last.mood;
                    document.querySelectorAll('.mood-btn').forEach(b => {
                        if (b.dataset.mood === last.mood) b.classList.add('selected');
                    });
                    this._applyMoodTheme(last.mood);
                }
                if (last.weather) {
                    document.getElementById('weather-select').value = last.weather;
                }
            }
        },

        _saveCurrentEntry() {
            const textarea = document.getElementById('diary-input');
            const content = textarea.value.trim();
            if (!content) {
                this._showToast('写点什么再保存吧 😊');
                return;
            }

            const today = new Date().toISOString().slice(0, 10);
            const now = new Date().toISOString();
            const weather = document.getElementById('weather-select').value;

            // 检查是否有已有 entry 需要更新
            const existing = Storage.getEntries(today);
            let entry;
            if (existing.length > 0) {
                entry = existing[existing.length - 1];
                entry.content = content;
                entry.mood = this.currentMood || entry.mood;
                entry.weather = weather || entry.weather;
                entry.timestamp = now;
            } else {
                entry = {
                    id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    date: today,
                    timestamp: now,
                    content: content,
                    mood: this.currentMood || 'okay',
                    weather: weather,
                    type: 'free'
                };
            }

            Storage.saveEntry(entry);
            this._updateHeader();
            this._showToast('日记已保存 📝');
            // 每日心情卡片
            this._showDailyCard(this.currentMood || 'good', content);

            // 清空
            textarea.value = '';
            this.currentMood = null;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('weather-select').value = '';
            this._updateCharCount();
        },

        // ---- 历史视图 ----
        _updateHistory() {
            const container = document.getElementById('history-list');
            const empty = document.getElementById('history-empty');
            const range = document.getElementById('hist-range');

            // 计算显示的日期范围（按 offset 偏移）
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() - this.historyOffset * 7);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            range.textContent = `${startDate.getMonth()+1}/${startDate.getDate()} - ${endDate.getMonth()+1}/${endDate.getDate()}`;

            const entries = Storage.getEntriesInRange(
                startDate.toISOString().slice(0, 10),
                endDate.toISOString().slice(0, 10)
            );

            if (entries.length === 0) {
                container.innerHTML = '';
                empty.classList.remove('hidden');
                return;
            }
            empty.classList.add('hidden');

            // 按日期分组
            const grouped = {};
            entries.forEach(e => {
                if (!grouped[e.date]) grouped[e.date] = [];
                grouped[e.date].push(e);
            });

            const moodEmoji = { great: '😊', good: '🙂', okay: '😐', bad: '😔', terrible: '😢' };
            let html = '';
            Object.keys(grouped).sort().reverse().forEach(date => {
                const dayEntries = grouped[date];
                dayEntries.forEach(entry => {
                    const preview = entry.content.replace(/\n/g, ' ').slice(0, 60);
                    const mood = moodEmoji[entry.mood] || '';
                    const d = new Date(date);
                    const weekday = ['日','一','二','三','四','五','六'][d.getDay()];
                    html += `
                        <div class="history-card" data-id="${entry.id}" data-date="${date}">
                            <div>
                                <div class="history-card-date">${date.slice(5)} 周${weekday}</div>
                                <div class="history-card-title">${preview || '(无内容)'}</div>
                                ${entry.weather ? `<div class="history-card-preview">☁️ ${entry.weather}</div>` : ''}
                            </div>
                            <div class="history-card-mood">${mood}</div>
                        </div>
                    `;
                });
            });

            container.innerHTML = html;

            // 点击查看详情
            container.querySelectorAll('.history-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.dataset.id;
                    const date = card.dataset.date;
                    const entries = Storage.getEntries(date);
                    const entry = entries.find(e => e.id === id);
                    if (entry) this._showEntryDetail(entry);
                });
            });
        },

        _showEntryDetail(entry) {
            const date = new Date(entry.date);
            const weekday = ['日','一','二','三','四','五','六'][date.getDay()];
            const moodEmoji = { great: '😊 很棒', good: '🙂 不错', okay: '😐 一般', bad: '😔 不好', terrible: '😢 很差' };
            const moodStr = moodEmoji[entry.mood] || '';
            const weatherMap = { sunny: '☀️ 晴', cloudy: '⛅ 多云', rainy: '🌧️ 雨', snowy: '❄️ 雪', windy: '🌬️ 风' };
            const weatherStr = weatherMap[entry.weather] || '';

            const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';

            let metaHtml = `${entry.date.slice(0,4)}年${entry.date.slice(5,7)}月${entry.date.slice(8,10)}日 周${weekday}`;
            if (time) metaHtml += ` ${time}`;
            if (moodStr) metaHtml += ` · ${moodStr}`;
            if (weatherStr) metaHtml += ` · ${weatherStr}`;

            document.getElementById('detail-date').textContent = '日记详情';
            document.getElementById('detail-body').innerHTML = `
                <div class="detail-meta">${metaHtml}</div>
                <div>${entry.content.replace(/\n/g, '<br>')}</div>
            `;
            document.getElementById('detail-modal').classList.remove('hidden');
        },

        // ---- 周视图 ----
        _updateWeekly() {
            const container = document.getElementById('weekly-content');
            const empty = document.getElementById('weekly-empty');
            const label = document.getElementById('week-label');

            const now = new Date();
            const currentWeek = Storage.getWeekNumber(now);
            const targetWeek = currentWeek + this.weekOffset;
            const year = now.getFullYear();

            label.textContent = `${year}年 第${targetWeek}周`;

            // 先检查是否有缓存
            const cacheKey = `${year}-W${targetWeek}`;
            const cached = Storage.getWeeklyStrength(cacheKey);
            if (cached) {
                empty.classList.add('hidden');
                this._renderWeeklyStrength(container, cached);
                return;
            }

            const entries = Storage.getWeekEntries(year, targetWeek);
            if (entries.length === 0) {
                container.innerHTML = '';
                empty.classList.remove('hidden');
                return;
            }
            empty.classList.add('hidden');

            const result = Analysis.analyzeWeek(entries);
            if (result) {
                Storage.saveWeeklyStrength(cacheKey, result);
                this._renderWeeklyStrength(container, result);
            } else {
                container.innerHTML = '<div class="empty-state"><p>本周日记数据不足，继续记录吧</p></div>';
            }
        },

        _renderWeeklyStrength(container, result) {
            let html = `
                <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
                    本周写了 ${result.entryCount} 篇日记 · 主要情绪：${result.dominantMood}
                </div>
            `;

            // 优势卡
            html += '<div style="margin-bottom:12px;"><strong>💎 识别到的优势</strong></div>';
            result.strengths.forEach((s, idx) => {
                const colors = ['#FEF3C7', '#DBEAFE', '#FCE7F3'];
                html += `
                    <div class="strength-card ${idx === 1 && result.strengths.length > 1 ? 'highlight' : ''}">
                        <div class="strength-header">
                            <div class="strength-icon" style="background:${colors[idx % 3]}">${s.icon}</div>
                            <div class="strength-name">${s.name}</div>
                        </div>
                        <div class="strength-details">${s.detail}</div>
                        ${s.evidence ? `<div class="strength-sources">📌 相关记录：${s.evidence.slice(0, 2).join('；')}</div>` : ''}
                    </div>
                `;
            });

            // 潜在优势
            if (result.hiddenStrengths && result.hiddenStrengths.length > 0) {
                html += `<div class="hidden-strength">
                    <div class="hidden-strength-label">🔍 潜在优势（你可能还没发现的）</div>
                    ${result.hiddenStrengths.map(h => `<div class="hidden-strength-text" style="margin-top:8px;">${h}</div>`).join('')}
                </div>`;
            }

            container.innerHTML = html;
        },

        // ---- 教练视图 ----
        _updateCoaching() {
            const container = document.getElementById('coaching-content');
            const empty = document.getElementById('coaching-empty');
            const label = document.getElementById('coach-label');

            const now = new Date();
            const period = Storage.getBiWeekPeriod(now);
            // 根据 offset 偏移
            const periodStart = new Date(period.start);
            periodStart.setDate(periodStart.getDate() + this.coachOffset * 14);
            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + 13);
            const periodKey = periodStart.toISOString().slice(0, 10);
            const periodLabel = `${periodStart.getMonth()+1}月${periodStart.getDate()}日 - ${periodEnd.getMonth()+1}月${periodEnd.getDate()}日`;
            label.textContent = periodLabel;

            // 检查缓存
            const cached = Storage.getCoachingReport(periodKey);
            if (cached) {
                empty.classList.add('hidden');
                document.getElementById('btn-analyze').style.display = 'none';
                this._renderCoachingReport(container, cached);
                return;
            }

            // 检查是否有足够的 data
            const entries = Storage.getEntriesInRange(
                periodStart.toISOString().slice(0, 10),
                periodEnd.toISOString().slice(0, 10)
            );
            if (entries.length < 3) {
                container.innerHTML = '';
                empty.classList.remove('hidden');
                document.getElementById('btn-analyze').style.display = 'inline-flex';
                return;
            }

            // 有数据但未生成报告
            container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:14px;">
                ${periodLabel} 有 ${entries.length} 篇日记，点击上方按钮生成教练报告
            </div>`;
            empty.classList.add('hidden');
            document.getElementById('btn-analyze').style.display = 'inline-flex';
            document.getElementById('btn-analyze').dataset.periodKey = periodKey;
            document.getElementById('btn-analyze').dataset.periodStart = periodStart.toISOString().slice(0, 10);
        },

        _generateCoachingReport() {
            const btn = document.getElementById('btn-analyze');
            const periodKey = btn.dataset.periodKey;
            const periodStart = btn.dataset.periodStart;
            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + 13);

            const entries = Storage.getEntriesInRange(periodStart, periodEnd.toISOString().slice(0, 10));
            if (entries.length < 3) {
                this._showToast('至少需要3天的日记才能生成报告');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '分析中...';

            // 模拟分析（同步执行，但用 setTimeout 让 UI 更新）
            setTimeout(() => {
                const result = Analysis.analyzeBiWeek(entries);
                if (result) {
                    Storage.saveCoachingReport(periodKey, result);
                    this._renderCoachingReport(document.getElementById('coaching-content'), result);
                    btn.style.display = 'none';
                    this._showToast('教练报告已生成 🎉');
                } else {
                    this._showToast('数据不足，无法生成报告');
                }
                btn.disabled = false;
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 生成教练报告';
            }, 300);
        },

        _renderCoachingReport(container, result) {
            let html = '';

            // 1. 行为模式
            html += `<div class="coaching-section">
                <h3>📊 行为模式分析</h3>
                <div style="margin-bottom:16px;">
                    <strong style="color:#166534;font-size:14px;">正向行为模式</strong>
                    ${result.positivePatterns.map(p => `
                        <div style="margin-top:8px;padding:10px 12px;background:#F0FDF4;border-radius:8px;border-left:3px solid #22C55E;">
                            <div style="font-weight:600;font-size:14px;">${p.icon} ${p.name}</div>
                            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${p.desc}</div>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <strong style="color:#991B1B;font-size:14px;">待优化模式</strong>
                    ${result.improvePatterns.map(p => `
                        <div style="margin-top:8px;padding:10px 12px;background:#FEF2F2;border-radius:8px;border-left:3px solid #EF4444;">
                            <div style="font-weight:600;font-size:14px;">⚠️ ${p.name}</div>
                            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${p.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;

            // 2. 卡点深挖 & 优势复用
            html += `<div class="coaching-section">
                <h3>🔍 深度洞察</h3>
                <div style="margin-bottom:14px;">
                    <strong style="color:#1E40AF;font-size:14px;">卡点：${result.cardPoint.title}</strong>
                    <div style="font-size:13px;color:var(--text-secondary);margin-top:6px;line-height:1.7;">${result.cardPoint.deepDive}</div>
                </div>
                <div>
                    <strong style="color:#166534;font-size:14px;">优势复用场景</strong>
                    <ul style="margin-top:6px;padding-left:18px;">
                        ${result.cardPoint.reuseScenarios.map(s => `<li style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:6px;">${s}</li>`).join('')}
                    </ul>
                </div>
            </div>`;

            // 3. 行动计划
            html += `<div class="coaching-section">
                <h3>🎯 可落地的行动计划</h3>
                ${result.actionPlans.map(p => `
                    <div class="plan-card">
                        <div class="plan-type">${p.icon} ${p.type}</div>
                        <div class="plan-title">${p.title}</div>
                        <div class="plan-desc">${p.desc}</div>
                    </div>
                `).join('')}
            </div>`;

            container.innerHTML = html;
        },

        // ---- 微信检测 ----
        _isWeChat() {
            return navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1;
        },

        // ---- 更新 OG URL（在微信中分享时使用） ----
        _updateOgUrl() {
            const url = window.location.href;
            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl) ogUrl.setAttribute('content', url);
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) ogImage.setAttribute('content', url.replace(/\/?$/, '') + '/og-image.png');

            // 检查是否在微信中
            if (this._isWeChat()) {
                document.getElementById('btn-voice').innerHTML =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg> <span>微信暂不支持</span>';
                document.getElementById('btn-voice').title = '微信内置浏览器暂不支持语音输入，建议在 Safari 或 Chrome 中使用';
                document.getElementById('btn-voice').style.opacity = '0.5';
            }
        },

        // ---- 分享应用（Web Share API / 复制链接） ----
        _handleShareApp() {
            const url = window.location.href;
            const title = '心记 · 每日日记';
            const text = '记录日常，发掘优势，获得人生教练分析。你的私人日记本，打开即用。';

            if (navigator.share) {
                navigator.share({ title, text, url }).catch(() => {});
            } else {
                // 降级：复制链接
                this._copyText(url, '链接已复制，快去分享给朋友吧！');
            }
        },

        // ---- 分享单篇日记 ----
        _handleShareEntry(entry) {
            const dateStr = entry.date;
            const preview = entry.content.replace(/\n/g, ' ').slice(0, 60);
            const shareText = `📝 ${dateStr} 的日记\n\n${preview}\n\n—— 来自「心记」`;
            const url = window.location.href;

            if (navigator.share) {
                navigator.share({ title: '我的日记', text: shareText, url }).catch(() => {});
            } else {
                this._copyText(shareText + '\n' + url, '日记内容已复制，快去分享吧！');
            }
        },

        // ---- 复制文本到剪贴板 ----
        _copyText(text, successMsg) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this._showToast(successMsg);
                }).catch(() => {
                    this._fallbackCopy(text, successMsg);
                });
            } else {
                this._fallbackCopy(text, successMsg);
            }
        },

        _fallbackCopy(text, successMsg) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                this._showToast(successMsg);
            } catch {
                this._showToast('复制失败，请手动复制链接');
            }
            document.body.removeChild(ta);
        },

        // ---- 导出数据备份 ----
        _handleExport() {
            const data = Storage.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `xinji-backup-${today}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this._showToast('数据已导出 ✅ 请妥善保管备份文件');
        },

        // ---- 导入数据备份 ----
        _handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // 验证数据结构
                    if (!data.entries && !data.weeklyStrengths && !data.coachingReports) {
                        this._showToast('备份文件格式有误，请检查');
                        return;
                    }
                    if (confirm('导入将覆盖当前所有数据，确定继续吗？')) {
                        // 直接写入 localStorage
                        const existing = Storage.exportAll();
                        // 合并 entries
                        const merged = {
                            entries: { ...existing.entries },
                            weeklyStrengths: { ...existing.weeklyStrengths },
                            coachingReports: { ...existing.coachingReports }
                        };
                        Object.keys(data.entries || {}).forEach(date => {
                            if (!merged.entries[date]) merged.entries[date] = [];
                            // 去重
                            const existingIds = new Set(merged.entries[date].map(e => e.id));
                            data.entries[date].forEach(e => {
                                if (!existingIds.has(e.id)) merged.entries[date].push(e);
                            });
                        });
                        Object.assign(merged.weeklyStrengths, data.weeklyStrengths || {});
                        Object.assign(merged.coachingReports, data.coachingReports || {});
                        // 覆盖保存
                        const raw = JSON.stringify(merged);
                        localStorage.setItem('xinji_data', raw);
                        this._updateHeader();
                        this._updateHistory();
                        this._updateWeekly();
                        this._updateCoaching();
                        this._showToast('数据导入成功 🎉');
                    }
                } catch {
                    this._showToast('文件解析失败，请确认是有效的备份文件');
                }
            };
            reader.readAsText(file);
            // 重置 input 以便再次选择同一文件
            event.target.value = '';
        },

        // ---- 删除单篇日记 ----
        _handleDeleteEntry(entry) {
            if (!confirm('确定要删除这篇日记吗？删除后不可恢复。')) return;
            Storage.deleteEntry(entry.date, entry.id);
            document.getElementById('detail-modal').classList.add('hidden');
            this._currentEntry = null;
            this._updateHeader();
            this._updateHistory();
            this._showToast('日记已删除');
        },


        // ---- 每日金句库（按心情分类） ----
        _quotes: {
            'great': [
                '今天也是闪闪发光的一天 ✨',
                '你比自己想象的更有力量 💪',
                '美好的一天，值得被记住 🌟',
                '今天的你，真的很棒 🌈',
                '你的光芒，照亮了今天的路 ☀️',
                '保持这份热情，世界会为你让路 🔥',
            ],
            'good': [
                '平凡的日子里，也有不平凡的光 🌅',
                '慢慢来，一切都来得及 🌿',
                '每一天都是一个新的开始 🌱',
                '今天的努力，是明天的底气 📈',
                '知足常乐，今天也不错 😊',
                '你正在成为更好的自己 💫',
            ],
            'okay': [
                '心情一般也没关系，写下来就好了 📝',
                '平淡的日子，才是生活的底色 🏠',
                '放松一点，你不需要时刻完美 🍃',
                '停下来，也是一种前进 ⏸️',
                '今天不坏，就是好天气 ☁️',
                '给自己一点空间，慢慢调整 🌊',
            ],
            'bad': [
                '天空不会一直下雨，也不会一直晴 🌈',
                '有些情绪不需要解决，只需要被看见 👀',
                '今天的不开心，就留在今天吧 🌙',
                '对自己温柔一点，你值得被善待 💛',
                '难过的时候，写下来就会好一些 ✍️',
                '每一个低谷，都是上坡路的开始 ⛰️',
            ],
            'terrible': [
                '累了就休息，没人责怪你 🛌',
                '黑暗的时刻也会过去 🌅',
                '你不需要一个人扛着所有 🤝',
                '抱抱今天的自己，你已经很努力了 🫂',
                '允许自己脆弱，也是勇敢的一种 💧',
                '明天会更好，我保证 🌟',
            ]
        },

        // ---- 应用心情主题（页面颜色变化） ----
        _applyMoodTheme(mood) {
            // 移除所有心情 class
            ['great','good','okay','bad','terrible'].forEach(m => {
                document.body.classList.remove('mood-' + m);
            });
            if (mood) {
                document.body.classList.add('mood-' + mood);
                // 更新 header 文字颜色
                const h1 = document.querySelector('#app-header h1');
                if (h1) {
                    const moodColors = {
                        'great': '#D97706',
                        'good': '#059669',
                        'okay': '#2563EB',
                        'bad': '#7C3AED',
                        'terrible': '#4F46E5'
                    };
                    h1.style.color = moodColors[mood] || '';
                }
            }
            // 更新状态栏图标颜色
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                const bgColors = {
                    'great': '#FFFBEB',
                    'good': '#ECFDF5',
                    'okay': '#EFF6FF',
                    'bad': '#F5F3FF',
                    'terrible': '#F0F0FF'
                };
                metaTheme.setAttribute('content', bgColors[mood] || '#FAF8F5');
            }
        },

        // ---- 根据心情获取每日金句 ----
        _getDailyQuote(mood) {
            const quotes = this._quotes[mood] || this._quotes['good'];
            // 根据日期决定，确保同一天看到同样的话（但每次不必完全相同）
            const today = new Date().toISOString().slice(0, 10);
            const dayNum = today.split('-').reduce((a, b) => a + parseInt(b), 0);
            const idx = dayNum % quotes.length;
            // 再加一点随机性
            const randIdx = Math.abs(this._hashString(today + mood)) % quotes.length;
            return quotes[randIdx];
        },

        _hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },

        // ---- 每日心情卡片 ----
        _showDailyCard(mood, content) {
            if (!mood) mood = 'good';
            const quote = this._getDailyQuote(mood);
            const now = new Date();
            const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            const dateStr = `${now.getMonth()+1}月${now.getDate()}日`;
            const weekday = weekdays[now.getDay()];
            const moodEmojis = { great: '😊', good: '🙂', okay: '😐', bad: '😔', terrible: '😢' };
            const emoji = moodEmojis[mood] || '🙂';

            // 设置卡片内容
            document.getElementById('card-date').innerHTML = 
                `${dateStr} <span style="font-size:16px;font-weight:400;">${weekday}</span>`;
            document.getElementById('card-mood').textContent = emoji;
            document.getElementById('card-quote').textContent = quote;

            // 设置卡片渐变主题
            const card = document.getElementById('daily-card');
            ['great','good','okay','bad','terrible'].forEach(m => {
                card.classList.remove('mood-gradient-' + m);
            });
            card.classList.add('mood-gradient-' + mood);

            // 显示卡片
            document.getElementById('daily-card-modal').classList.remove('hidden');
        },

        _dismissDailyCard() {
            document.getElementById('daily-card-modal').classList.add('hidden');
        },

        _showToast(msg) {
            toast.textContent = msg;
            toast.classList.remove('hidden');
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
        }
    };

    // ======================================================
    // 启动应用
    // ======================================================
    document.addEventListener('DOMContentLoaded', () => App.init());
})();
