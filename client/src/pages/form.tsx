import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type FormData = {
  name: string;
  email: string;
  referralSource: string;
  referralSourceOther: string;
  additionalInfo: string;
};

type ValidationErrors = {
  name?: string;
  email?: string;
  referralSource?: string;
  referralSourceOther?: string;
  additionalInfo?: string;
};

const allQuestions = [
  {
    id: "name",
    label: "What's your name?",
    placeholder: "Enter your full name",
    type: "text" as const,
    helper: "We'd love to know who we're talking to",
  },
  {
    id: "email",
    label: "What's your email address?",
    placeholder: "your@email.com",
    type: "email" as const,
    helper: "We'll use this to get in touch with you",
  },
  {
    id: "referralSource",
    label: "How did you hear about us?",
    placeholder: "Select an option",
    type: "select" as const,
    helper: "This helps us understand how people find us",
    options: ["Google", "Friend", "Social Media", "Other"],
  },
  {
    id: "additionalInfo",
    label: "Tell us more about your request",
    placeholder: "Share any details that would help us understand your needs...",
    type: "textarea" as const,
    helper: "Feel free to be as detailed as you'd like",
  },
];

export default function Form() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    referralSource: "",
    referralSourceOther: "",
    additionalInfo: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessionStartTime] = useState(() => Date.now());

  const questions = allQuestions;
  const currentQuestion = questions[currentStep];
  const currentValue = formData[currentQuestion.id as keyof FormData];

  const validateField = useCallback((field: keyof FormData, value: string): string | undefined => {
    const question = allQuestions.find(q => q.id === field);
    
    // Skip validation for optional fields
    if (field === "referralSource" || field === "referralSourceOther") {
      return undefined;
    }
    
    if (!value.trim()) {
      return `${question?.label.replace("?", "")} is required`;
    }
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }
    return undefined;
  }, []);

  const handleFieldChange = (value: string) => {
    const field = currentQuestion.id as keyof FormData;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = () => {
    const field = currentQuestion.id as keyof FormData;
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, currentValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const trackAnalytics = async (endpoint: string, data: any, method: "POST" | "PATCH" = "POST") => {
    try {
      await apiRequest(method, endpoint, data);
    } catch (error) {
      console.error("Analytics tracking failed:", error);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      await trackAnalytics("/api/analytics/event", {
        sessionId,
        step: currentStep,
        eventType: "submit"
      });

      const response = await apiRequest("POST", "/api/form-submissions", formData);
      const submissionData = await response.json();
      
      const timeToComplete = Math.floor((Date.now() - sessionStartTime) / 1000);
      
      if (submissionData?.id) {
        await trackAnalytics("/api/analytics/session-complete", {
          sessionId,
          submissionId: submissionData.id,
          timeToComplete
        }, "PATCH");
      }

      setLocation("/success");
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error?.message || "There was a problem submitting your form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNext = async () => {
    const field = currentQuestion.id as keyof FormData;
    const error = validateField(field, currentValue);
    
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: error }));

    if (error) return;

    trackAnalytics("/api/analytics/event", {
      sessionId,
      step: currentStep,
      eventType: "next"
    });

    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      await submitForm();
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      trackAnalytics("/api/analytics/event", {
        sessionId,
        step: currentStep,
        eventType: "back"
      });
      
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  useEffect(() => {
    trackAnalytics("/api/analytics/session-start", { sessionId });
  }, [sessionId]);

  useEffect(() => {
    trackAnalytics("/api/analytics/event", {
      sessionId,
      step: currentStep,
      eventType: "view"
    });
  }, [currentStep, sessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;
      
      // Ctrl/Cmd+Enter submits the form from anywhere
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (currentStep === questions.length - 1) {
          goToNext(); // Submit on final step
        }
        return;
      }
      
      // For textarea fields, allow natural Enter/Shift+Enter for newlines
      // Don't intercept these - users need to create multi-line content
      if (currentQuestion.type === "textarea") {
        // Escape still works to go back
        if (e.key === "Escape") {
          e.preventDefault();
          goToPrevious();
        }
        // Let all Enter variations pass through for newlines
        return;
      }
      
      // For non-textarea fields: Enter or Shift+Enter advances
      if (e.key === "Enter") {
        e.preventDefault();
        goToNext();
        return;
      }
      
      // Escape to go back
      if (e.key === "Escape") {
        e.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, currentValue, errors, isSubmitting, currentQuestion.type]);

  useEffect(() => {
    const inputElement = document.querySelector('input, textarea') as HTMLElement;
    if (inputElement) {
      inputElement.focus();
    }
  }, [currentStep]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const currentError = errors[currentQuestion.id as keyof ValidationErrors];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-6 right-6 z-10">
        <div className="flex items-center gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary/60"
                  : "w-2 bg-muted"
              }`}
              data-testid={`progress-dot-${index}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-0 hover:bg-primary/15"
                  data-testid={`question-badge-${currentStep}`}
                >
                  {currentStep + 1} →
                </Badge>
                <h1 className="text-4xl md:text-5xl font-semibold text-foreground leading-tight" data-testid={`question-title-${currentStep}`}>
                  {currentQuestion.label}
                </h1>
              </div>

              <div className="space-y-3">
                {currentQuestion.type === "select" ? (
                  <>
                    <Select 
                      value={currentValue} 
                      onValueChange={(value) => handleFieldChange(value)}
                    >
                      <SelectTrigger 
                        className="text-xl border-0 border-b-2 border-muted-foreground/20 rounded-none bg-transparent px-0 py-4 focus:ring-0 focus:border-primary transition-colors"
                        data-testid={`select-${currentQuestion.id}`}
                      >
                        <SelectValue placeholder={currentQuestion.placeholder} />
                      </SelectTrigger>
                      <SelectContent data-testid={`select-content-${currentQuestion.id}`}>
                        {currentQuestion.options?.map((option) => (
                          <SelectItem 
                            key={option} 
                            value={option}
                            data-testid={`select-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentQuestion.id === "referralSource" && formData.referralSource === "Other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pt-6 space-y-3"
                      >
                        <p className="text-xl text-foreground">Please specify where you heard about us</p>
                        <Input
                          type="text"
                          value={formData.referralSourceOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, referralSourceOther: e.target.value }))}
                          placeholder="Tell us more..."
                          className="text-xl border-0 border-b-2 border-muted-foreground/20 rounded-none bg-transparent px-0 py-4 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          data-testid="input-referralSourceOther"
                        />
                        <p className="text-sm text-muted-foreground">We appreciate you sharing this information</p>
                      </motion.div>
                    )}
                  </>
                ) : currentQuestion.type === "textarea" ? (
                  <Textarea
                    value={currentValue}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    onBlur={handleFieldBlur}
                    placeholder={currentQuestion.placeholder}
                    className="text-xl min-h-32 resize-none border-0 border-b-2 border-muted-foreground/20 rounded-none bg-transparent px-0 py-4 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                    data-testid={`input-${currentQuestion.id}`}
                  />
                ) : (
                  <Input
                    type={currentQuestion.type}
                    value={currentValue}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    onBlur={handleFieldBlur}
                    placeholder={currentQuestion.placeholder}
                    className="text-xl border-0 border-b-2 border-muted-foreground/20 rounded-none bg-transparent px-0 py-4 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                    data-testid={`input-${currentQuestion.id}`}
                  />
                )}
                {currentError && touched[currentQuestion.id as keyof FormData] ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                    data-testid={`error-${currentQuestion.id}`}
                  >
                    {currentError}
                  </motion.p>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid={`helper-${currentQuestion.id}`}>
                    {currentQuestion.helper}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-muted-foreground hidden sm:block"
            data-testid="keyboard-hint"
          >
            {currentQuestion.type === "textarea" ? (
              <>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd> for new line, use button or{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + Enter</kbd> to{" "}
                {currentStep === questions.length - 1 ? "submit" : "continue"}
              </>
            ) : (
              <>
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter ↵</kbd> to continue
              </>
            )}
          </motion.div>

          <div className="flex items-center gap-3 ml-auto">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={goToPrevious}
                disabled={isSubmitting}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              onClick={goToNext}
              disabled={isSubmitting}
              className="gap-2"
              data-testid="button-continue"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {currentStep === questions.length - 1 ? "Submit" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
