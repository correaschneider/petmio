'use client';

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  creatorReducer,
  initialCreatorState,
  type CreatorAction,
  type CreatorState,
} from './creatorStore';

interface CreatorContextValue {
  state: CreatorState;
  dispatch: Dispatch<CreatorAction>;
}

const CreatorContext = createContext<CreatorContextValue | null>(null);

export function CreatorProvider({
  children,
  initialState = initialCreatorState,
}: {
  children: ReactNode;
  initialState?: CreatorState;
}) {
  const [state, dispatch] = useReducer(creatorReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
}

export function useCreator(): CreatorContextValue {
  const ctx = useContext(CreatorContext);
  if (!ctx) throw new Error('useCreator() fora do <CreatorProvider>');
  return ctx;
}
