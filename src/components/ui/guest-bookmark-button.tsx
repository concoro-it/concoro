"use client";

import * as React from "react";
import { Bookmark, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface GuestBookmarkButtonProps {
  className?: string;
}

export function GuestBookmarkButton({ className }: GuestBookmarkButtonProps) {
  const { signInWithGoogle } = useAuth();

  const handleClick = async () => {
    try {
      toast.info("Effettua l'accesso per salvare i concorsi", {
        action: {
          label: "Accedi",
          onClick: async () => {
            try {
              await signInWithGoogle();
              toast.success("Accesso effettuato con successo!");
            } catch (error: any) {
              console.error('Google sign in error:', error);
              toast.error(error.message || "Errore durante l'accesso");
            }
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={className}
      title="Accedi per salvare questo concorso"
    >
      <Bookmark className="opacity-60" size={16} aria-hidden="true" />
    </Button>
  );
}
