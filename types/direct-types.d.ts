import { Store, ActionContext } from "vuex"
import { ActionsImpl, GettersImpl, ModulesImpl, MutationsImpl, StoreOptions, StoreOrModuleOptions } from "./index"

export type ToDirectStore<O extends StoreOptions> = {
  readonly state: ToFlatType<DirectState<O>>
  getters: ToFlatType<DirectGetters<O>>
  commit: ToFlatType<DirectMutations<O>>
  dispatch: ToFlatType<DirectActions<O>>
  original: VuexStore<O>

  directActionContext: <P extends StoreOrModuleOptions>(
    options: P, context: ActionContext<any, any>
  ) => DirectActionContext<O, P>
}

export type VuexStore<O extends StoreOptions> = Store<ToFlatType<DirectState<O>>> & {
  direct: ToDirectStore<O>
}

// State

type DirectState<O extends StoreOrModuleOptions> =
  ToStateObj<O["state"]>
  & GetStateInModules<OrEmpty<O["modules"]>>

type GetStateInModules<I extends ModulesImpl> = {
  [M in keyof I]: DirectState<I[M]>
}

type ToStateObj<T> = T extends (() => any) ? ReturnType<T> : T

// Getters

type DirectGetters<O extends StoreOrModuleOptions> =
  ToDirectGetters<OrEmpty<O["getters"]>>
  & GetGettersInModules<FilterNamespaced<OrEmpty<O["modules"]>>>
  & FlattenGetters<FilterNotNamespaced<OrEmpty<O["modules"]>>>

type GetGettersInModules<I extends ModulesImpl> = {
  [M in keyof I]: DirectGetters<I[M]>
}

type ToDirectGetters<T extends GettersImpl> = {
  [K in keyof T]: ReturnType<T[K]>
}

type FlattenGetters<I extends ModulesImpl> = UnionToIntersection<I[keyof I]["getters"]>

// Mutations

type DirectMutations<O extends StoreOrModuleOptions> =
  ToDirectMutations<OrEmpty<O["mutations"]>>
  & GetMutationsInModules<FilterNamespaced<OrEmpty<O["modules"]>>>
  & FlattenMutations<FilterNotNamespaced<OrEmpty<O["modules"]>>>

type GetMutationsInModules<I extends ModulesImpl> = {
  [M in keyof I]: DirectMutations<I[M]>
}

type ToDirectMutations<T extends MutationsImpl> = {
  [K in keyof T]: Parameters<T[K]>[1] extends undefined
  ? (() => void)
  : ((payload: Parameters<T[K]>[1]) => void)
}

type FlattenMutations<I extends ModulesImpl> = UnionToIntersection<I[keyof I]["mutations"]>

// Actions

type DirectActions<O extends StoreOrModuleOptions> =
  ToDirectActions<OrEmpty<O["actions"]>>
  & GetActionsInModules<FilterNamespaced<OrEmpty<O["modules"]>>>
  & FlattenActions<FilterNotNamespaced<OrEmpty<O["modules"]>>>

type GetActionsInModules<I extends ModulesImpl> = {
  [M in keyof I]: DirectActions<I[M]>
}

type ToDirectActions<T extends ActionsImpl> = {
  [K in keyof T]: Parameters<T[K]>[1] extends undefined
  ? (() => PromiseOf<ReturnType<T[K]>>)
  : ((payload: Parameters<T[K]>[1]) => PromiseOf<ReturnType<T[K]>>)
}

type FlattenActions<I extends ModulesImpl> = UnionToIntersection<I[keyof I]["actions"]>

// ActionContext

type DirectActionContext<R, O> = {
  rootState: ToFlatType<DirectState<R>>
  rootGetters: ToFlatType<DirectGetters<R>>
  rootCommit: ToFlatType<DirectMutations<R>>
  rootDispatch: ToFlatType<DirectActions<R>>
  state: ToFlatType<DirectState<O>>
  getters: ToFlatType<DirectGetters<O>>
  commit: ToFlatType<DirectMutations<O>>
  dispatch: ToFlatType<DirectActions<O>>
}

// Common helpers

type PromiseOf<T> = T extends Promise<any> ? T : Promise<T>

type FilterNamespaced<I extends ModulesImpl> = Pick<I, KeyOfType<I, { namespaced: true }>>

type FilterNotNamespaced<I extends ModulesImpl> = Pick<I, KeyOfType<I, { namespaced?: false }>>

type KeyOfType<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

type OrEmpty<T> = T extends {} ? T : {}

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ToFlatType<T> =
  T extends Store<any> | Function ? T :
  T extends object ?
  T extends infer O ? { [K in keyof O]: ToFlatType<O[K]> } : never
  : T