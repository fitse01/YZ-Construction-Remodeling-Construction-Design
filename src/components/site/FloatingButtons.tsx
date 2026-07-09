import { Phone, MessageCircle } from "lucide-react";

export function FloatingButtons() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href="https://wa.me/12407818778"
        className="w-13 h-13 grid place-items-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
        aria-label="WhatsApp"
        style={{ width: 52, height: 52 }}
      >
        <MessageCircle className="w-5 h-5" />
      </a>
      <a
        href="tel:+12407818778"
        className="w-13 h-13 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
        aria-label="Call"
        style={{ width: 52, height: 52 }}
      >
        <Phone className="w-5 h-5" />
      </a>
    </div>
  );
}
