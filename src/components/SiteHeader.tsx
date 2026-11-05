import { useLanguage } from '../i18n';
import { LanguageSelect } from './LanguageSelect';
import { TranslatedText } from './StableText';

type Props={dark?:boolean;audio?:boolean;onToggleTheme?:()=>void;onToggleSound?:()=>void;onClose?:()=>void};
export function SiteHeader({dark=false,audio=false,onToggleTheme,onToggleSound,onClose}:Props){
 const {t}=useLanguage();
 return <header className="site-header"><a className="brand" href="./" aria-label={t('Rose Wishes, trang chủ')}><img className="brand__icon" src="/images/logo.png" width="34" height="40" alt="" decoding="async"/> ROSE WISHES<span className="brand__tagline">A LITTLE LOVE, JUST FOR YOU</span></a><div className="site-header__actions">
  {onClose?<button className="site-header__close" onClick={onClose} aria-label={t('Trở lại bó hoa')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>:<>
   <LanguageSelect/>
   <button className="theme-toggle" onClick={onToggleTheme} aria-pressed={dark} aria-label={dark?t('Chuyển sang ban ngày'):t('Chuyển sang ban đêm')} title={dark?t('Chuyển sang ban ngày'):t('Chuyển sang ban đêm')}><span className="theme-toggle__orbit" aria-hidden="true"><svg className="theme-toggle__sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2 2m11.6 11.6 2 2M4.2 19.8l2-2M17.8 6.2l2-2"/></svg><svg className="theme-toggle__moon" viewBox="0 0 24 24"><path d="M20 15.3A9 9 0 0 1 8.7 4a9 9 0 1 0 11.3 11.3Z"/></svg></span><span><TranslatedText message={dark?'Ban đêm':'Ban ngày'}/></span></button>
   <button className="sound-toggle" onClick={onToggleSound} aria-pressed={audio} aria-label={audio?t('Tắt âm thanh'):t('Bật âm thanh')}><svg className="sound-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>{audio?<><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></>:<path d="m16 9 6 6m0-6-6 6"/>}</svg><span className="sound-toggle__label"><TranslatedText message={audio?'Âm thanh bật':'Âm thanh tắt'}/></span></button>
  </>}
 </div></header>;
}
