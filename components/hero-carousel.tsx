"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react"
import { EffectCoverflow, Navigation, Autoplay } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"

// Import Swiper styles
import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/navigation"

const heroImages = [
  { id: 1, image: "/hero/hero-01.jpg", title: "Featured Art 1" },
  { id: 2, image: "/hero/hero-02.jpg", title: "Featured Art 2" },
  { id: 3, image: "/hero/hero-03.jpg", title: "Featured Art 3" },
  { id: 4, image: "/hero/hero-04.jpg", title: "Featured Art 4" },
  { id: 5, image: "/hero/hero-05.jpg", title: "Featured Art 5" },
  { id: 6, image: "/hero/hero-06.jpg", title: "Featured Art 6" },
  { id: 7, image: "/hero/hero-07.jpg", title: "Featured Art 7" },
  { id: 8, image: "/hero/hero-08.jpg", title: "Featured Art 8" },
  { id: 9, image: "/hero/hero-09.jpg", title: "Featured Art 9" },
  { id: 10, image: "/hero/hero-10.jpg", title: "Featured Art 10" },
]

export default function HeroCarousel() {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <div className="relative h-[300px] sm:h-[400px] md:h-[450px] w-full overflow-hidden bg-gradient-to-b from-background to-background/50 py-6 sm:py-12" suppressHydrationWarning>
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        initialSlide={4}
        coverflowEffect={{
          rotate: 20,
          stretch: 0,
          depth: 200,
          modifier: 1.5,
          slideShadows: true,
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        speed={800}
        modules={[EffectCoverflow, Navigation, Autoplay]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        className="h-full w-full landingSwiper"
      >
        {heroImages.map((slide) => (
          <SwiperSlide key={slide.id} className="!w-[200px] sm:!w-[250px] md:!w-[280px] !mr-4 sm:!mr-6 md:!mr-10">
            <div className="relative h-[250px] sm:h-[300px] md:h-[350px] w-full overflow-hidden rounded-2xl shadow-2xl transition-all">
              <img 
                src={slide.image || "/placeholder.svg"} 
                alt={slide.title} 
                className="h-full w-full object-cover" 
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-2 sm:left-4 top-1/2 z-40 h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-2 sm:right-4 top-1/2 z-40 h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background transition-all"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  )
}