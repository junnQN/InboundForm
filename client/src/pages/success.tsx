import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Success() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.querySelector('button')?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center space-y-8 max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 
            className="w-20 h-20 text-primary mx-auto" 
            strokeWidth={1.5}
            data-testid="icon-success"
          />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-semibold text-foreground"
            data-testid="text-thank-you"
          >
            Thank you!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground leading-relaxed"
            data-testid="text-confirmation"
          >
            Your request has been submitted successfully. We'll review your information and get back to you soon.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="gap-2"
            data-testid="button-home"
          >
            <Home className="w-4 h-4" />
            Back to Form
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
