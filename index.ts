import * as Bot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as schedule from 'node-schedule';

dotenv.config();

interface Chat {
  chatId: number;
  userName: string;
  leaveTime: number;
  langCode?: string;
}

const token = process.env.API_TOKEN || '';

const bot = new Bot(token, { polling: true });
let chats: Chat[] = [];

bot.onText(/^\/echo (.+)/, (msg, match) => {
  if (!match) {
    return;
  }
  const chatId = msg.chat.id;
  const res = `Simple Bot : ${match[1]}`;
  bot.sendMessage(chatId, res);
});

bot.onText(/^\/subscribe (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userName = msg.chat.first_name ? msg.chat.first_name : '';

  const existChat = chats.find(chat => chat.chatId === chatId);

  const langCode = getLangCode(msg);

  let resMessage = translateKorean(
    langCode,
    `${userName}, 이미 등록되었어요!`,
    `${userName}, you are already subscribed!`
  );

  if (existChat) {
    bot.sendMessage(chatId, resMessage);
    return;
  }

  resMessage = translateKorean(
    langCode,
    `${userName}, 퇴근 시간을 입력해주세요!`,
    `${userName}, please input your leave time!`
  );

  if (!match || match[1].replace(/[0-9]+/, '')) {
    console.log(match![1].replace(/[0-9]+/, ''));
    bot.sendMessage(chatId, resMessage);
    return;
  }

  const leaveTime = Number(match[1]);
  const newChat: Chat = { chatId, userName, leaveTime, langCode };

  chats.push(newChat);

  resMessage = translateKorean(
    langCode,
    `${userName}, 퇴근 시간이 등록되었어요!`,
    `${userName}, you are subscribed!`
  );

  bot.sendMessage(chatId, resMessage);
});

bot.onText(/^\/unsubscribe/, (msg, match) => {
  const chatId = msg.chat.id;
  const userName = msg.chat.first_name;

  const existChat = chats.find(chat => chat.chatId === chatId);
  const langCode = getLangCode(msg);

  let resMessage = translateKorean(
    langCode,
    `${userName}, 등록된 퇴근시간이 없어요!`,
    `${userName}, you are not subscribed!`
  );

  if (!existChat) {
    bot.sendMessage(chatId, resMessage);
    return;
  }

  chats = chats.filter(chat => chat.chatId !== chatId);

  resMessage = translateKorean(
    langCode,
    `${userName}, 등록 해제 되었어요!`,
    `${userName}, you are now unsubscribe!`
  );

  bot.sendMessage(chatId, resMessage);
});

bot.on('message', msg => {
  const chatId = msg.chat.id;

  const langCode = getLangCode(msg);

  const resMessage = translateKorean(
    langCode,
    `메시지가 전달되었어요!`,
    `received your message!`
  );
  bot.sendMessage(chatId, resMessage);
});

function translateKorean(langCode: string, korMsg: string, engMsg: string) {
  let resMessage = engMsg;
  if (langCode === 'ko') {
    resMessage = korMsg;
  }
  return resMessage;
}

function getLangCode(msg: Bot.Message) {
  if (msg.from && msg.from.language_code) {
    return msg.from.language_code;
  }

  return 'ko';
}

function alarmLeaveTime() {
  const exp = `55 * * * *`;
  schedule.scheduleJob(exp, () => {
    console.log('CRON RUNNING');
    chats = chats.filter(chat => {
      const curTime = new Date();
      if (curTime.getHours() >= chat.leaveTime) {
        const langCode = chat.langCode ? chat.langCode : 'ko';
        const resMessage = translateKorean(
          langCode,
          '퇴근 시간 5분 전이에요!',
          "It's five minutes before work!"
        );
        bot.sendMessage(chat.chatId, resMessage);
        return false;
      }
      return true;
    });
  });
}

alarmLeaveTime();
