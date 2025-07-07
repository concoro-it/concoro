import * as React from 'react';
import * as Form from '@radix-ui/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
}) => (
  <Form.Field className="grid gap-2 mb-4" name={name}>
    <div className="flex items-baseline justify-between">
      <Form.Label className="text-sm font-medium leading-none">
        {label}
      </Form.Label>
      {error && (
        <Form.Message className="text-sm font-medium text-destructive">
          {error}
        </Form.Message>
      )}
    </div>
    <Form.Control asChild>
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className={error ? 'border-destructive' : ''}
      />
    </Form.Control>
  </Form.Field>
);

interface AuthFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ children, onSubmit }) => (
  <Form.Root
    className="w-full max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg"
    onSubmit={onSubmit}
  >
    {children}
  </Form.Root>
);

interface AuthButtonProps {
  children: React.ReactNode;
  type?: 'submit' | 'button';
  variant?: 'default' | 'outline' | 'secondary';
  onClick?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  type = 'button',
  variant = 'default',
  onClick,
  fullWidth = false,
  disabled = false,
}) => (
  <Button
    type={type}
    variant={variant}
    onClick={onClick}
    className={`${fullWidth ? 'w-full' : ''}`}
    disabled={disabled}
  >
    {children}
  </Button>
);

export const AuthDivider: React.FC = () => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-background text-muted-foreground">
        Or continue with
      </span>
    </div>
  </div>
);

export const AuthError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
      {message}
    </div>
  );
};

export const AuthSuccess: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="p-3 mb-4 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
      {message}
    </div>
  );
}; 