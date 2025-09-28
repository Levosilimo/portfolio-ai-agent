// @/components/ui/Carousel/Carousel.tsx
"use client";

import React, { ReactNode, useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay, { AutoplayOptionsType, AutoplayType } from "embla-carousel-autoplay";
import { PrevButton, NextButton } from "./CarouselButtons";
import {EmblaOptionsType} from "embla-carousel";

export interface EmblaCarouselProps {
    options?: EmblaOptionsType;
    autoplayOptions?: AutoplayOptionsType;
    showPagination?: boolean;
    children: ReactNode[];
    className?: string;
    variableWidth?: boolean; // NEW
}

export default function Carousel({
                                     options,
                                     autoplayOptions,
                                     showPagination = false,
                                     children,
                                     className,
                                     variableWidth = false,
                                 }: EmblaCarouselProps) {
    const plugins: AutoplayType[] = [];
    if (autoplayOptions) {
        plugins.push(Autoplay({ stopOnInteraction: false, ...autoplayOptions }));
    }

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, ...options }, plugins);

    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => {
        if (!emblaApi) return;
        emblaApi.scrollPrev();
        emblaApi.plugins()?.autoplay?.reset();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (!emblaApi) return;
        emblaApi.scrollNext();
        emblaApi.plugins()?.autoplay?.reset();
    }, [emblaApi]);

    const scrollTo = useCallback(
        (index: number) => {
            if (emblaApi) emblaApi.scrollTo(index);
        },
        [emblaApi],
    );

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    return (
        <div className={`relative ${className ?? ""}`}>
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex w-full">
                    {React.Children.map(children, (child, idx) => (
                        <div
                            key={idx}
                            className={
                                variableWidth
                                    ? "flex-[0_0_auto] px-1" // allows variable width slides
                                    : "flex-[0_0_100%] min-w-0" // full-width slides
                            }
                        >
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
            <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />

            {showPagination && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={`h-2 w-2 rounded-full transition ${
                                index === selectedIndex ? "bg-blue-600" : "bg-gray-400/50"
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
