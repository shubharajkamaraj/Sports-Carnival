"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const galleryImages = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=800&q=80",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800&q=80",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  },
];

export default function GalleryPreview() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold">
            Gallery
          </h2>

          <p className="mt-3 text-gray-500">
            Relive the best moments of our Sports Carnival.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {galleryImages.map((item, index) => (

            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl shadow-lg"
            >
              <Image
                src={item.image}
                alt="Sports Gallery"
                width={600}
                height={400}
                className="h-72 w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </motion.div>

          ))}

        </div>

        <div className="mt-12 text-center">
          <button className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700">
            View All Photos
          </button>
        </div>

      </div>
    </section>
  );
}