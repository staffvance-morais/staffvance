"use client";

import React, { useState, useRef, useEffect } from "react";
import { SquareChevronDown } from "lucide-react";

export default function FormSelect({
  icon: Icon,
  name,
  value,
  onChange,
  children,
  options: customOptions,
  placeholder: customPlaceholder,
  className = "",
  required = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const optionsList = customOptions || (
    React.Children.toArray(children)
      .filter((child) => React.isValidElement(child) && child.type === "option")
      .map((child) => ({
        value: child.props.value ?? "",
        label: child.props.children,
        disabled: child.props.disabled,
        hidden: child.props.hidden,
      }))
  );

  const placeholderOption = optionsList.find(
    (opt) => opt.disabled || opt.hidden || opt.value === ""
  );
  const placeholderText = customPlaceholder || placeholderOption?.label || "Selecione...";

  const selectableOptions = optionsList.filter(
    (opt) => !opt.hidden && !opt.disabled && opt.value !== ""
  );

  const selectedOption = selectableOptions.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: optionValue,
        },
      });
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative flex w-full flex-col ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 border-2 border-neutral-600 bg-neutral-700 px-4 text-left transition-colors focus:border-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? "border-neutral-500" : ""
        }`}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          {Icon && <Icon className="h-8 w-8 shrink-0 text-neutral-400" />}
          <span
            className={`truncate text-2xl ${
              selectedOption ? "text-neutral-200" : "text-neutral-400"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholderText}
          </span>
        </div>

        <SquareChevronDown
          className={`h-8 w-8 shrink-0 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-neutral-200" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="z-20 flex w-full flex-col divide-y-2 divide-neutral-700 border-x-2 border-b-2 border-neutral-600 bg-neutral-800"
        >
          {selectableOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full cursor-pointer items-center px-4 py-3.5 text-left text-2xl transition-colors hover:bg-neutral-700/80 hover:text-white ${
                  isSelected
                    ? "bg-neutral-700/40 text-neutral-100 font-medium"
                    : "text-neutral-400"
                }`}
              >
                <span className="leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <input
        type="hidden"
        name={name}
        value={value || ""}
        required={required}
      />
    </div>
  );
}
