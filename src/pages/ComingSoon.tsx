import { Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";

interface ComingSoonProps {
  title?: string;
  message?: string;
}

const ComingSoon = ({ 
  title = "Coming Soon",
  message = "This feature is currently under development and will be available soon."
}: ComingSoonProps) => {
  return (
    <PageLayout>
      <div className="container flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
          <div className="text-9xl font-extrabold text-muted/20">HN</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-hn-orange">
            <div className="bg-hn-orange text-white font-bold h-20 w-20 rounded-lg flex items-center justify-center text-3xl">
              👨‍💻
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-semibold mb-3">{title}</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/"
            className="px-6 py-3 bg-hn-orange text-white rounded-md font-medium hover:bg-hn-orange/90 transition-colors"
          >
            Go Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-secondary text-foreground rounded-md font-medium hover:bg-secondary/70 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default ComingSoon; 