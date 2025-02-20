"use client";

import { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditableKeywordsProps {
  keywords: Record<string, string[]>;
  onUpdate: (keywords: Record<string, string[]>) => void;
}

export function EditableKeywords({ keywords, onUpdate }: EditableKeywordsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<{category: string, index: number} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editedKeywords, setEditedKeywords] = useState(keywords);

  useEffect(() => {
    setEditedKeywords(keywords);
  }, [keywords]);

  const handleEdit = (category: string, index: number, value: string) => {
    setEditingKeyword({ category, index });
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editingKeyword) return;
    
    const newKeywords = {...editedKeywords};
    newKeywords[editingKeyword.category][editingKeyword.index] = editValue.trim();
    setEditedKeywords(newKeywords);
    setEditingKeyword(null);
  };

  const handleRemove = (category: string, index: number) => {
    const newKeywords = {...editedKeywords};
    newKeywords[category] = newKeywords[category].filter((_, i) => i !== index);
    if (newKeywords[category].length === 0) {
      delete newKeywords[category];
    }
    setEditedKeywords(newKeywords);
  };

  const handleUpdate = () => {
    onUpdate(editedKeywords);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Search Keywords</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      {Object.entries(editedKeywords).map(([category, terms]) => (
        <div key={category} className="space-y-1">
          <div className="font-medium text-sm">{category}:</div>
          <div className="flex flex-wrap gap-2">
            {terms.map((term, index) => (
              <div
                key={`${category}-${index}`}
                className="group flex items-center bg-secondary rounded-full px-3 py-1 text-sm"
              >
                {editingKeyword?.category === category && editingKeyword?.index === index ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="bg-transparent border-none focus:outline-none w-20"
                    autoFocus
                  />
                ) : (
                  <>
                    <span 
                      onClick={() => handleEdit(category, index, term)}
                      className="cursor-text"
                    >
                      {term}
                    </span>
                    <button
                      onClick={() => handleRemove(category, index)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {isEditing && (
        <Button 
          className="w-full mt-4" 
          onClick={handleUpdate}
        >
          Update Search
        </Button>
      )}
    </div>
  );
}
