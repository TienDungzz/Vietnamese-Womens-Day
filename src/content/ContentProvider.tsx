import { createContext,useContext,useEffect,useState } from 'react';
import type { ReactNode } from 'react';
import { wishes } from '../data/wishes';
import { englishWishes } from '../data/wishes.en';
import { photos,photoSource } from '../photobooth/photoCatalog';
import { SceneLoadingOverlay } from '../components/SceneLoadingOverlay';
import { hasApi,loadContent } from './client';
import type { Content } from './schema';
export const defaultContent:Content={source:'local',photoSource,photos,wishes:wishes.map(w=>({id:w.id,title:{vi:w.title,en:englishWishes[w.id]?.title??w.title},text:{vi:w.text,en:englishWishes[w.id]?.text??w.text}}))};
const config={contentUrl:import.meta.env.VITE_CONTENT_API_URL?.trim(),wishesUrl:import.meta.env.VITE_WISHES_API_URL?.trim(),photosUrl:import.meta.env.VITE_PHOTOS_API_URL?.trim()};
const configured=hasApi(config);
// Shared startup request also avoids duplicate fetching under StrictMode.
let startup:ReturnType<typeof loadContent>|undefined;
const context=createContext(defaultContent);
export function ContentProvider({children}:{children:ReactNode}){
 const [content,setContent]=useState<Content|null>(configured?null:defaultContent);
 useEffect(()=>{if(!configured)return;let cancelled=false;startup??=loadContent(config,defaultContent,window.location.href);
  void startup.then(result=>{if(cancelled)return;if(result.errors.length)console.warn('[Rose Wishes content API]',...result.errors);setContent(result.content)});
  return()=>{cancelled=true};
 },[]);
 return content?<context.Provider value={content}>{children}</context.Provider>:<SceneLoadingOverlay failed={false}/>;
}
export const useContent=()=>useContext(context);
