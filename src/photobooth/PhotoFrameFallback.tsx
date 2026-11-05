import { useContent } from '../content/ContentProvider';
import { useLanguage } from '../i18n';
import { FrameHitArea } from './FrameHitArea';
export function PhotoFrameFallback({onOpen}:{onOpen:()=>void}){
 const {photos}=useContent();
 const {t}=useLanguage();
 return <div className="photo-stack photo-stack--fallback"><img src={photos[0].thumb} alt=""/><FrameHitArea label={t('20 khoảnh khắc')} onOpen={onOpen}/></div>;
}
