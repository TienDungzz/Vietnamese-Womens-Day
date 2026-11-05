import { useLanguage } from '../i18n';
export function SceneLoadingOverlay({failed}:{failed:boolean}){
 const {t}=useLanguage();
 return <div className="scene-loading" role={failed?'alert':'status'} aria-live="polite" aria-busy={!failed}>
  {!failed&&<span className="scene-loading__ring" aria-hidden="true"/>}
  <p>{failed?t('Chưa thể tải đầy đủ cảnh.'):t('Chờ một chút nhé, có điều bất ngờ dành cho em…')}</p>
  <small>{failed?t('Bạn có thể thử tải lại.'):t('Những điều đẹp đẽ luôn đáng để chờ đợi.')}</small>
  {failed&&<button onClick={()=>window.location.reload()}>{t('Tải lại')}</button>}
 </div>;
}
