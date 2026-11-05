import type { ReactNode } from 'react';
import { translate, useLanguage } from '../i18n';
import type { Language, Message } from '../i18n';

// Both translations participate in layout. Only the current one is visible
// and exposed to assistive technology, so switching cannot resize the slot.
export function StableText({content}:{content:Record<Language,ReactNode>}){
 const {language}=useLanguage();
 return <span className="stable-text">{(['vi','en'] as const).map(locale=><span key={locale} lang={locale} className="stable-text__layer" data-active={locale===language} aria-hidden={locale!==language}>{content[locale]}</span>)}</span>;
}
export function TranslatedText({message,values}:{message:Message;values?:Record<string,string|number>}){
 return <StableText content={{vi:translate('vi',message,values),en:translate('en',message,values)}}/>;
}
export function StableHeading({explore}:{explore:boolean}){
 const heading=(locale:Language)=>{
  const text=(key:Message)=>translate(locale,key);
  return explore?<>{text('Mỗi đóa hoa,')}<br/><em>{text('một lời thương.')}</em></>:<>{text('Có một điều anh')}<br/>{text('muốn gửi đến')} <em>{text('em…')}</em></>;
 };
 return <StableText content={{vi:heading('vi'),en:heading('en')}}/>;
}
