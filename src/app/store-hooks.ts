import { useDispatch, useSelector, useStore } from 'react-redux'
import type { RootState, ShopStore } from './store'

export const useShopDispatch = useDispatch.withTypes<ShopStore['dispatch']>()
export const useShopSelector = useSelector.withTypes<RootState>()
export const useShopStore = useStore.withTypes<ShopStore>()
