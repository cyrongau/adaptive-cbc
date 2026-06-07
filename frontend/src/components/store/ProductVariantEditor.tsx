'use client';

import { Plus, Trash2 } from 'lucide-react';

export interface ProductVariantOption {
  value: string;
  priceAdjustment?: number;
  stock?: number;
}

export interface ProductVariant {
  name: string;
  options: ProductVariantOption[];
}

interface ProductVariantEditorProps {
  value: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  dark?: boolean;
}

const emptyOption = (): ProductVariantOption => ({ value: '', priceAdjustment: 0, stock: 0 });
const emptyVariant = (): ProductVariant => ({ name: '', options: [emptyOption()] });

export default function ProductVariantEditor({ value, onChange, dark = false }: ProductVariantEditorProps) {
  const variants = Array.isArray(value) ? value : [];
  const inputClass = dark
    ? 'bg-[#0f1729] border border-[#2a3550] text-[#dae2fd] placeholder-[#6b7a99] focus:outline-none focus:ring-2 focus:ring-[#47a263]/30'
    : 'border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#47a263]/30';
  const panelClass = dark ? 'bg-[#0f1729] border-[#2a3550]' : 'bg-slate-50 border-slate-200';
  const labelClass = dark ? 'text-[#dae2fd]' : 'text-slate-700';
  const mutedClass = dark ? 'text-[#8899bb]' : 'text-slate-500';

  const updateVariant = (index: number, patch: Partial<ProductVariant>) => {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  };

  const updateOption = (variantIndex: number, optionIndex: number, patch: Partial<ProductVariantOption>) => {
    onChange(
      variants.map((variant, i) => {
        if (i !== variantIndex) return variant;
        return {
          ...variant,
          options: variant.options.map((option, j) => (j === optionIndex ? { ...option, ...patch } : option)),
        };
      }),
    );
  };

  const addOption = (variantIndex: number) => {
    onChange(
      variants.map((variant, i) => (
        i === variantIndex
          ? { ...variant, options: [...(variant.options || []), emptyOption()] }
          : variant
      )),
    );
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    onChange(
      variants.map((variant, i) => {
        if (i !== variantIndex) return variant;
        const nextOptions = variant.options.filter((_, j) => j !== optionIndex);
        return { ...variant, options: nextOptions.length ? nextOptions : [emptyOption()] };
      }),
    );
  };

  const cleanVariants = variants.filter((variant) =>
    variant.name.trim() && variant.options.some((option) => option.value.trim()),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className={`block text-sm font-medium ${labelClass}`}>Product Variants</label>
          <p className={`text-xs ${mutedClass} mt-0.5`}>Examples: Format, Size, Cover type, Bundle.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...variants, emptyVariant()])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#47a263] text-white text-xs font-semibold hover:bg-[#3d8c54]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <div className={`rounded-xl border ${panelClass} p-4 text-sm ${mutedClass}`}>
          No variants configured. Add one when this product has choices such as PDF vs print, sizes, bundles, or different stock per option.
        </div>
      ) : (
        variants.map((variant, variantIndex) => (
          <div key={variantIndex} className={`rounded-xl border ${panelClass} p-4 space-y-3`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={variant.name}
                onChange={(event) => updateVariant(variantIndex, { name: event.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${inputClass}`}
                placeholder="Variant name, e.g. Format"
              />
              <button
                type="button"
                onClick={() => onChange(variants.filter((_, i) => i !== variantIndex))}
                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                title="Remove variant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(variant.options || []).map((option, optionIndex) => (
                <div key={optionIndex} className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_36px] gap-2">
                  <input
                    type="text"
                    value={option.value}
                    onChange={(event) => updateOption(variantIndex, optionIndex, { value: event.target.value })}
                    className={`px-3 py-2 rounded-lg text-sm ${inputClass}`}
                    placeholder="Option, e.g. PDF"
                  />
                  <input
                    type="number"
                    value={option.priceAdjustment ?? 0}
                    onChange={(event) => updateOption(variantIndex, optionIndex, { priceAdjustment: Number(event.target.value) || 0 })}
                    className={`px-3 py-2 rounded-lg text-sm ${inputClass}`}
                    placeholder="+/- KES"
                  />
                  <input
                    type="number"
                    value={option.stock ?? 0}
                    onChange={(event) => updateOption(variantIndex, optionIndex, { stock: Number(event.target.value) || 0 })}
                    className={`px-3 py-2 rounded-lg text-sm ${inputClass}`}
                    placeholder="Stock"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(variantIndex, optionIndex)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                    title="Remove option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addOption(variantIndex)}
              className={`text-xs font-semibold ${dark ? 'text-[#7eda95]' : 'text-[#47a263]'} hover:underline`}
            >
              Add option
            </button>
          </div>
        ))
      )}

      {cleanVariants.length !== variants.length && variants.length > 0 && (
        <p className={`text-xs ${mutedClass}`}>Blank variant names or options will be ignored when the product is saved.</p>
      )}
    </div>
  );
}

export function normalizeProductVariants(variants: ProductVariant[]): ProductVariant[] {
  return (Array.isArray(variants) ? variants : [])
    .map((variant) => ({
      name: String(variant.name || '').trim(),
      options: (Array.isArray(variant.options) ? variant.options : [])
        .map((option) => ({
          value: String(option.value || '').trim(),
          priceAdjustment: Number(option.priceAdjustment || 0),
          stock: Number(option.stock || 0),
        }))
        .filter((option) => option.value),
    }))
    .filter((variant) => variant.name && variant.options.length);
}
