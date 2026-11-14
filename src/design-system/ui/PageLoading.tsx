import './PageLoading.css'

export function PageLoading({ label }: { label: string }) {
  return (
    <div id="page-loading" role="status" aria-label={label} data-loading="true" data-opening>
      <div className="page-loading-record" aria-hidden="true">
        <div className="page-loading-vinyl">
          <div className="discovery-vinyl">
            <div className="discovery-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
              </svg>
            </div>
          </div>
        </div>
        <span className="page-loading-wordmark">Soundlines</span>
      </div>
    </div>
  )
}
