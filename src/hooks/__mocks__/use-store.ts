// Реэкспортируем хук из нашего мок-провайдера
import { useMockStore } from "../../components/mocks/store-provider"

// Экспортируем его под оригинальным именем
export const useStore = useMockStore
