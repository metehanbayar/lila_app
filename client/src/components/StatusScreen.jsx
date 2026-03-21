import { PageShell, SurfaceCard, Button } from './ui/primitives';

function StatusScreen({
  icon: Icon,
  tone = 'success',
  title,
  description,
  details,
  notes,
  primaryAction,
  secondaryAction,
}) {
  const toneMap = {
    success: {
      iconWrap: 'bg-green-100 text-green-700',
      panel: 'bg-green-50 border-green-200',
    },
    error: {
      iconWrap: 'bg-red-100 text-red-700',
      panel: 'bg-red-50 border-red-200',
    },
    info: {
      iconWrap: 'bg-primary/10 text-primary-dark',
      panel: 'bg-blue-50 border-blue-200',
    },
  };

  const palette = toneMap[tone] || toneMap.success;

  return (
    <div className="min-h-[calc(100vh-140px)] py-8 sm:py-10 lg:py-14">
      <PageShell width="content">
        <SurfaceCard className="overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="space-y-6 text-center">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] ${palette.iconWrap}`}>
              <Icon className="h-10 w-10" />
            </div>

            <div className="space-y-3">
              <h1 className="gm-display text-4xl sm:text-5xl">{title}</h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-dark-lighter sm:text-base">{description}</p>
            </div>

            {details}

            {notes && <div className={`rounded-[24px] border p-4 text-left text-sm leading-7 ${palette.panel}`}>{notes}</div>}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {primaryAction && (
                <Button onClick={primaryAction.onClick} className="sm:min-w-[220px]">
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button variant="secondary" onClick={secondaryAction.onClick} className="sm:min-w-[220px]">
                  {secondaryAction.icon}
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </SurfaceCard>
      </PageShell>
    </div>
  );
}

export default StatusScreen;
