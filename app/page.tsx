import { HandleForm } from "@/components/handle-form";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-12 text-center">
        {/* Logo / Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v4H7V7zm0 6h10v4H7v-4zm6-6h4v4h-4V7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            ATProto Heatmap
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Visualize your AT Protocol activity with beautiful heatmaps
          </p>
        </div>

        {/* Search Form */}
        <div className="flex justify-center">
          <HandleForm />
        </div>
      </div>
    </div>
  );
}
