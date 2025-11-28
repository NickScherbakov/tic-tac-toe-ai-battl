import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Language, t } from '@/lib/i18n';

interface MathTask {
  question: string;
  answer: number;
}

interface EarnMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  language: Language;
}

function generateMathTask(): MathTask {
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  
  let a, b, answer;
  
  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
      return { question: `${a} + ${b}`, answer };
    
    case '-':
      a = Math.floor(Math.random() * 50) + 30;
      b = Math.floor(Math.random() * 30) + 1;
      answer = a - b;
      return { question: `${a} - ${b}`, answer };
    
    case '*':
      a = Math.floor(Math.random() * 10) + 2;
      b = Math.floor(Math.random() * 10) + 2;
      answer = a * b;
      return { question: `${a} × ${b}`, answer };
    
    default:
      return { question: '2 + 2', answer: 4 };
  }
}

export function EarnMatchesDialog({
  open,
  onOpenChange,
  onSuccess,
  language,
}: EarnMatchesDialogProps) {
  const [task, setTask] = useState<MathTask>(generateMathTask());
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (open) {
      setTask(generateMathTask());
      setUserAnswer('');
      setError(false);
      setAttempts(0);
    }
  }, [open]);

  const handleSubmit = () => {
    const answer = parseInt(userAnswer);
    
    if (isNaN(answer)) {
      setError(true);
      return;
    }
    
    if (answer === task.answer) {
      onSuccess();
      onOpenChange(false);
    } else {
      setError(true);
      setAttempts(attempts + 1);
      
      if (attempts >= 2) {
        // After 3 attempts, generate new task
        setTask(generateMathTask());
        setUserAnswer('');
        setError(false);
        setAttempts(0);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🪵</span>
            {t(language, 'earnMatches.title')}
          </DialogTitle>
          <DialogDescription>
            {t(language, 'earnMatches.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t(language, 'earnMatches.question')}
            </p>
            <div className="text-4xl font-bold text-purple-600 my-6">
              {task.question} = ?
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="answer">{t(language, 'earnMatches.yourAnswer')}</Label>
            <Input
              id="answer"
              type="number"
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={error ? 'border-red-500' : ''}
              placeholder="?"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">
                {t(language, 'earnMatches.wrongAnswer')}
                {attempts >= 2 && ` ${t(language, 'earnMatches.newTask')}`}
              </p>
            )}
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
            <p className="text-sm text-center">
              🎁 {t(language, 'earnMatches.reward')}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t(language, 'earnMatches.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!userAnswer}>
            {t(language, 'earnMatches.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
