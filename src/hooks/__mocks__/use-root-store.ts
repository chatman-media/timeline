// Реэкспортируем хук из нашего мок-провайдера
import { useMockRootStore } from "../../components/mocks/root-store-provider"

// Экспортируем его под оригинальным именем
export const useRootStore = useMockRootStore
