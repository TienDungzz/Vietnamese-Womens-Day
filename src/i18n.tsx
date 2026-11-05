import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export const messages = {
 '20 khoảnh khắc':'20 memories',

 'Chờ một chút nhé, có điều bất ngờ dành cho em…':'Just a moment, a little surprise awaits you…',
 'Những điều đẹp đẽ luôn đáng để chờ đợi.':'Beautiful things are worth waiting for.',
 'Chưa thể tải đầy đủ cảnh.':'We couldn’t finish preparing your surprise.',
 'Bạn có thể thử tải lại.':'Please try reloading.',
 'Tải lại':'Reload',
 'Rose Wishes, trang chủ':'Rose Wishes, home',
 'Chuyển sang ban ngày':'Switch to daytime',
 'Chuyển sang ban đêm':'Switch to nighttime',
 'Ban đêm':'Night', 'Ban ngày':'Day',
 'Tắt âm thanh':'Mute sound', 'Bật âm thanh':'Enable sound',
 'Âm thanh bật':'Sound on', 'Âm thanh tắt':'Sound off',
 'NGÀY PHỤ NỮ VIỆT NAM':'VIETNAMESE WOMEN’S DAY',
 'Mỗi đóa hoa,':'Every flower,', 'một lời thương.':'a little love.',
 'Có một điều anh':'There’s something', 'muốn gửi đến':'I want to share with', 'em…':'you…',
 'Có những điều dịu dàng, anh đã giấu trong từng cánh hoa.':'A little tenderness, hidden in every petal.',

 'Bó hoa hồng 3D tương tác':'Interactive 3D rose bouquet',
 'Khung cảnh chàng trai mang hoa đến ngôi nhà':'A young man bringing flowers to a house',
 'Chạm vào màn hình để anh bước đến bên em ♡':'Tap the screen and let me come to you ♡',
 'Anh đang đến, mang theo một chút yêu thương…':'On my way, bringing a little love…',
 'Cốc, cốc… Có một món quà dành cho em.':'Knock, knock… There’s a gift for you.',
 'Chúc mừng ngày Phụ nữ Việt Nam 20/10 ♡':'Happy Vietnamese Women’s Day, October 20 ♡',
 'Một điều dịu dàng đang chờ em…':'Something lovely is waiting for you…',
 'Tiến đến ngôi nhà':'Walk to the house', 'Mở cửa':'Open the door',
 'Bỏ qua phần mở đầu →':'Skip the introduction →',
 'Kéo để xoay':'Drag to rotate', 'Cuộn / chụm để thu phóng':'Scroll / pinch to zoom',
 'Chạm vào một bông hoa để mở lời chúc':'Tap a flower to reveal a wish',
 'Chọn một trong {count} bông hoa':'Choose one of {count} flowers',
 'Bông {number}: {title}':'Flower {number}: {title}',

 'Xem lại câu chuyện':'Replay the story', 'Góc nhìn ban đầu':'Reset the view',
 'Đóng thiệp':'Close the card', 'LỜI THƯƠNG':'A LITTLE LOVE',
 'Gửi em, bằng tất cả dịu dàng ♡':'For you, with all my tenderness ♡',
 '← Bông trước':'← Previous flower', 'Bông tiếp →':'Next flower →',
 'Trở lại bó hoa':'Back to the bouquet',
 'GỬI EM, BẰNG TẤT CẢ DỊU DÀNG ♡':'FOR YOU, WITH ALL MY TENDERNESS ♡',
 'Đã khám phá {seen}/{count} bông':'Discovered {seen}/{count} flowers',
 '01 — MỘT HÀNH TRÌNH YÊU THƯƠNG':'01 — A JOURNEY OF LOVE',
 'Bó hoa hồng bọc giấy kem, thắt nơ hồng':'A rose bouquet in cream wrapping with a pink ribbon',
 'Hành trình yêu thương — chế độ không có WebGL.':'A journey of love — simplified view without WebGL.',
 'Nhận bó hoa và khám phá lời chúc →':'Receive the bouquet and discover the wishes →',
 'Chọn các nút đánh số bên dưới để đọc đủ 10 lời chúc.':'Choose the numbered buttons below to read all 10 wishes.',
 'Ngôn ngữ':'Language',
 'Rose Wishes — Gửi em một điều dịu dàng':'Rose Wishes — A little tenderness for you',
 'Một bó hoa, mười lời thương. Món quà tương tác dành cho ngày Phụ nữ Việt Nam 20/10.':'One bouquet, ten heartfelt wishes. An interactive gift for Vietnamese Women’s Day, October 20.',
} as const;
export type Message = keyof typeof messages;
export type Language = 'vi'|'en';
export function translate(language:Language,key:Message,values:Record<string,string|number>={}){
 return (language==='en'?messages[key]:key).replace(/\{(\w+)\}/g,(_,name:string)=>String(values[name]??`{${name}}`));
}
const LanguageContext=createContext({language:'vi' as Language,setLanguage:(_language:Language)=>{},t:(key:Message,values?:Record<string,string|number>)=>translate('vi',key,values)});
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setLanguage]=useState<Language>(()=>{try{return localStorage.getItem('rose-language')==='en'?'en':'vi'}catch{return 'vi'}});
 useEffect(()=>{
  document.documentElement.lang=language;
  document.title=translate(language,'Rose Wishes — Gửi em một điều dịu dàng');
  document.querySelector('meta[name="description"]')?.setAttribute('content',translate(language,'Một bó hoa, mười lời thương. Món quà tương tác dành cho ngày Phụ nữ Việt Nam 20/10.'));
  try{localStorage.setItem('rose-language',language)}catch{}
 },[language]);
 return <LanguageContext.Provider value={{language,setLanguage,t:(key,values)=>translate(language,key,values)}}>{children}</LanguageContext.Provider>;
}
export const useLanguage=()=>useContext(LanguageContext);
