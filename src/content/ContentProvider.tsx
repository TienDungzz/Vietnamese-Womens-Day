import { createContext,useContext } from 'react';
import type { ReactNode } from 'react';
import { wishes } from '../data/wishes';
import { englishWishes } from '../data/wishes.en';
import { photos,photoSource } from '../photobooth/data';
export const defaultContent={source:'local' as const,photoSource,photos,wishes:wishes.map(w=>({id:w.id,title:{vi:w.title,en:englishWishes[w.id]?.title??w.title},text:{vi:w.text,en:englishWishes[w.id]?.text??w.text}}))};
const context=createContext(defaultContent);
export function ContentProvider({children}:{children:ReactNode}){return <context.Provider value={defaultContent}>{children}</context.Provider>}
export const useContent=()=>useContext(context);
