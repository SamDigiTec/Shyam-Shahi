import { useEffect, useRef } from 'react';
import { Bold, Heading3, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ label, value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#A9BBD3]">{label}</label>
      <div className="rounded-xl border border-[#24466C] bg-[#06152B] overflow-hidden">
        <div className="flex items-center gap-1 px-2.5 py-2 border-b border-[#24466C] bg-[#0B1F3A]">
          <button
            type="button"
            onClick={() => exec('bold')}
            title="Bold"
            className="p-1.5 rounded hover:bg-[#0D2747] text-[#A9BBD3] hover:text-white"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            title="Italic"
            className="p-1.5 rounded hover:bg-[#0D2747] text-[#A9BBD3] hover:text-white"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', 'h3')}
            title="Subheading"
            className="p-1.5 rounded hover:bg-[#0D2747] text-[#A9BBD3] hover:text-white"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-[#0D2747] text-[#A9BBD3] hover:text-white"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-[#0D2747] text-[#A9BBD3] hover:text-white"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
          data-placeholder={placeholder}
          className="min-h-[110px] p-3.5 text-sm text-[#F5F8FF] focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:font-semibold [&_h3]:text-base"
        />
      </div>
    </div>
  );
}
