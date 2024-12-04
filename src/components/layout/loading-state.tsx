export function LoadingState() {
  return (
    <div data-testid="loading-state">
      <div className="flex items-center justify-center py-5">
        <div className="flex flex-col gap-8 w-full px-3 sm:px-13">
          <div className="flex gap-8">
            <div className="w-[15%]">
              <div className="skeleton-loader w-24 h-6 mb-4 bg-gray-300 dark:bg-gray-700"></div>
              <div className="skeleton-loader w-20 h-8 mb-2 bg-gray-300 dark:bg-gray-700"></div>
              <div className="skeleton-loader w-32 h-4 bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="w-[25%]">
              <div className="skeleton-loader w-full h-32 bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="w-[60%]">
              <div className="skeleton-loader w-full h-[400px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
          </div>
          <div className="skeleton-loader w-full h-32 bg-gray-300 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  )
}
