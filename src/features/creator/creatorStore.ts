import {
  DEFAULT_TRAITS,
  normalizeName,
  withTrait,
  type PetTraits,
  type TraitKey,
} from '@/domain/pet';

export type CreatorStep = 'create' | 'name';

export interface CreatorState {
  step: CreatorStep;
  traits: PetTraits;
  name: string;
  /** Nome confirmado → mostra o resultado e o export. */
  confirmed: boolean;
  /** Incrementa a cada mudança feita pelo usuário (anima a prévia). */
  bump: number;
}

export type CreatorAction =
  | { type: 'setTrait'; key: TraitKey; value: PetTraits[TraitKey] }
  | { type: 'replaceTraits'; traits: PetTraits }
  | { type: 'setName'; name: string }
  | { type: 'goTo'; step: CreatorStep }
  | { type: 'confirmName' }
  | { type: 'editName' };

export const initialCreatorState: CreatorState = {
  step: 'create',
  traits: DEFAULT_TRAITS,
  name: '',
  confirmed: false,
  bump: 0,
};

export function creatorReducer(state: CreatorState, action: CreatorAction): CreatorState {
  switch (action.type) {
    case 'setTrait': {
      const traits = withTrait(state.traits, action.key, action.value);
      return traits === state.traits ? state : { ...state, traits, bump: state.bump + 1 };
    }
    case 'replaceTraits':
      return { ...state, traits: action.traits, bump: state.bump + 1 };
    case 'setName':
      // Guarda o texto cru (o input precisa do que foi digitado); normaliza no uso.
      return { ...state, name: action.name.slice(0, 64) };
    case 'goTo':
      return { ...state, step: action.step };
    case 'confirmName':
      return normalizeName(state.name) ? { ...state, confirmed: true } : state;
    case 'editName':
      return { ...state, confirmed: false };
  }
}
