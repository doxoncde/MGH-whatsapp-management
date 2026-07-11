import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Calendar,
  Clock,
  Copy,
  Check,
  DollarSign,
  Tent,
  Trees,
  Users,
  Waves,
  Utensils,
  ChevronRight,
  Info,
  Compass
} from 'lucide-react';

interface TariffGuideProps {
  onSendMessageToCustomer?: (text: string) => void;
}

export default function TariffGuide({ onSendMessageToCustomer }: TariffGuideProps) {
  const [activeSubTab, setActiveSubTab] = useState<'view' | 'calculator'>('view');
  const [copied, setCopied] = useState<boolean>(false);

  // Calculator states
  const [calcCategory, setCalcCategory] = useState<'room' | 'event' | 'gazebo' | 'pool' | 'park'>('room');
  
  // Room inputs (Supports multiple cottage blocks)
  const [selectedRooms, setSelectedRooms] = useState<{
    id: string;
    type: string;
    weekdayNights: number;
    weekendNights: number;
    extraAdults: number;
    extraChildren: number;
    qty: number;
  }[]>([
    { id: '1', type: 'Deluxe AC', weekdayNights: 1, weekendNights: 0, extraAdults: 0, extraChildren: 0, qty: 1 }
  ]);
  const [visitorsNoStay, setVisitorsNoStay] = useState<number>(0);

  // Discount states
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Event Tent inputs
  const [eventPax, setEventPax] = useState<string>('26 to 50');
  const [eventSlot, setEventSlot] = useState<'slot_1' | 'slot_2'>('slot_1');
  const [eventExtraHours, setEventExtraHours] = useState<number>(0);

  // Gazebo inputs
  const [gazeboPax, setGazeboPax] = useState<number>(5);

  // Pool inputs
  const [poolPax, setPoolPax] = useState<number>(10);
  const [poolHours, setPoolHours] = useState<number>(2);

  // Children's Park inputs
  const [parkAdults, setParkAdults] = useState<number>(2);
  const [parkKids, setParkKids] = useState<number>(2);

  const tariffData = {
    currency: "INR",
    stay_rules: {
      check_in: "2:00 PM",
      check_out: "12:00 PM",
      includes: "GST & complimentary breakfast (except park ticket)",
      extra_bed_adult: 600,
      extra_bed_child: 300,
      visitor_no_stay: 250
    },
    room_tariffs: [
      { type: "Deluxe Non-AC", capacity: "2A+1K", weekday: 2200, weekend_holiday: 2400 },
      { type: "Deluxe AC", capacity: "2A+1K", weekday: 2800, weekend_holiday: 3000 },
      { type: "Tree House Non-AC", capacity: "2A+1K", weekday: 2600, weekend_holiday: 2800 },
      { type: "Eagle Nest Dome 1 AC", capacity: "2A+1K (Couples/Families)", weekday: 4500, weekend_holiday: 5000 },
      { type: "Eagle Nest Dome 2 AC", capacity: "2A+2K (Couples/Families)", weekday: 5000, weekend_holiday: 5500 },
      { type: "2-Bedroom Cottage AC", capacity: "4A+2K", weekday: 7000, weekend_holiday: 7500 },
      { type: "Camping Tent", capacity: "2A", weekday: 1300, weekend_holiday: 1300 },
      { type: "Conference Hall Package", capacity: "Max 50 pax (18 stay)", package_rate: 19500, notes: "Includes 9 Non-AC rooms" }
    ],
    event_tents: {
      cleaning_fee: "1000-1500",
      extra_hour_under_100pax: 1000,
      extra_hour_over_100pax: 1500,
      slots: ["9 AM - 4 PM (Slot 1)", "3 PM - 8 PM (Slot 2)"],
      rates_by_pax: [
        { pax: "Up to 25", slot_1: 10000, slot_2: 11000 },
        { pax: "26 to 50", slot_1: 12000, slot_2: 13000 },
        { pax: "51 to 100", slot_1: 20000, slot_2: 21000 },
        { pax: "101 to 150", slot_1: 22000, slot_2: 23000 },
        { pax: "151+", slot_1: 23000, slot_2: 25000 }
      ]
    },
    gazebo_small_groups: {
      pax_limit: "Below 20",
      rate_per_head: 250,
      cleaning_fee: 500
    },
    pool_private_rent: {
      rate_per_head_per_hour: 150,
      min_bill: 1500,
      min_pax: 10,
      max_capacity: "15 adults + 5 kids",
      hours: "8 AM - 10 PM"
    },
    children_park_entry: {
      adult: 50,
      kid: 25,
      hours: "6:00 AM - 8:00 PM"
    }
  };

  // Calculation Logic
  const calculateResult = () => {
    let subtotal = 0;
    let details: string[] = [];
    let title = "";
    let rules = "";

    if (calcCategory === 'room') {
      title = "Stay Booking (Multiple Cottages)";
      let totalCottages = 0;
      
      selectedRooms.forEach((r, idx) => {
        const room = tariffData.room_tariffs.find(t => t.type === r.type);
        if (room) {
          const totalNights = r.weekdayNights + r.weekendNights;
          if (totalNights <= 0) return;
          
          totalCottages += r.qty;

          const baseWeekdayCost = room.weekday ?? room.package_rate ?? 0;
          const baseWeekendCost = room.weekend_holiday ?? room.package_rate ?? 0;

          const weekdayTotal = r.weekdayNights * baseWeekdayCost * r.qty;
          const weekendTotal = r.weekendNights * baseWeekendCost * r.qty;
          
          subtotal += weekdayTotal + weekendTotal;

          const roomLabel = r.qty > 1 ? `${r.type} (×${r.qty})` : r.type;

          if (r.weekdayNights > 0) {
            details.push(`• ${roomLabel} Weekday: ₹${baseWeekdayCost} × ${r.weekdayNights} Night(s) = ₹${weekdayTotal}`);
          }
          if (r.weekendNights > 0) {
            details.push(`• ${roomLabel} Weekend: ₹${baseWeekendCost} × ${r.weekendNights} Night(s) = ₹${weekendTotal}`);
          }

          // Extra Bed / Person calculations
          if (r.extraAdults > 0) {
            const extraAdultCost = r.extraAdults * tariffData.stay_rules.extra_bed_adult * totalNights * r.qty;
            subtotal += extraAdultCost;
            details.push(`• Extra Adult Bed [${r.type}]: ${r.extraAdults} × ₹${tariffData.stay_rules.extra_bed_adult} × ${totalNights} Night(s) × ${r.qty} = ₹${extraAdultCost}`);
          }
          if (r.extraChildren > 0) {
            const extraChildCost = r.extraChildren * tariffData.stay_rules.extra_bed_child * totalNights * r.qty;
            subtotal += extraChildCost;
            details.push(`• Extra Child Bed [${r.type}]: ${r.extraChildren} × ₹${tariffData.stay_rules.extra_bed_child} × ${totalNights} Night(s) × ${r.qty} = ₹${extraChildCost}`);
          }
        }
      });

      if (visitorsNoStay > 0) {
        const visitorCost = visitorsNoStay * tariffData.stay_rules.visitor_no_stay;
        subtotal += visitorCost;
        details.push(`• Visitor Charge (No stay): ${visitorsNoStay} × ₹${tariffData.stay_rules.visitor_no_stay} = ₹${visitorCost}`);
      }

      if (totalCottages === 0) {
        return { total: 0, text: 'Please configure at least 1 room with nights.', details: [] };
      }

      rules = `⏱️ *Stay Rules:*\n• Check-in: ${tariffData.stay_rules.check_in} | Check-out: ${tariffData.stay_rules.check_out}\n• Includes: ${tariffData.stay_rules.includes}`;
    } else if (calcCategory === 'event') {
      const tier = tariffData.event_tents.rates_by_pax.find(r => r.pax === eventPax);
      if (tier) {
        title = `Event Tent Booking (${eventPax} Pax)`;
        const baseRate = eventSlot === 'slot_1' ? tier.slot_1 : tier.slot_2;
        subtotal += baseRate;
        const slotName = eventSlot === 'slot_1' ? "9:00 AM - 4:00 PM (Slot 1)" : "3:00 PM - 8:00 PM (Slot 2)";
        details.push(`• Base Venue Rental (${slotName}): ₹${baseRate}`);

        // Extra hours
        if (eventExtraHours > 0) {
          const isOver100 = eventPax === '101 to 150' || eventPax === '151+';
          const hourlyRate = isOver100 ? tariffData.event_tents.extra_hour_over_100pax : tariffData.event_tents.extra_hour_under_100pax;
          const extraHoursCost = eventExtraHours * hourlyRate;
          subtotal += extraHoursCost;
          details.push(`• Extra Hours: ${eventExtraHours} Hour(s) × ₹${hourlyRate}/hr = ₹${extraHoursCost}`);
        }

        // Cleaning fee (display range note)
        details.push(`• Cleaning Fee (Invoiced extra): ₹${tariffData.event_tents.cleaning_fee}`);
        rules = `⏱️ *Event Slots:*\n• Slot 1: 9:00 AM - 4:00 PM\n• Slot 2: 3:00 PM - 8:00 PM\n• Includes setup time. Catering costs are billed separately.`;
      }
    } else if (calcCategory === 'gazebo') {
      title = `Floating Gazebo Booking (Small Groups)`;
      const totalHeadCharges = gazeboPax * tariffData.gazebo_small_groups.rate_per_head;
      const cleaningFee = tariffData.gazebo_small_groups.cleaning_fee;
      subtotal += totalHeadCharges + cleaningFee;

      details.push(`• Guest Charge: ${gazeboPax} Person(s) × ₹${tariffData.gazebo_small_groups.rate_per_head}/head = ₹${totalHeadCharges}`);
      details.push(`• Cleaning Fee (Fixed): ₹${cleaningFee}`);
      rules = `⏱️ *Rules & Capacities:*\n• Maximum Limit: ${tariffData.gazebo_small_groups.pax_limit} Pax\n• Perfect for family birthday celebrations and quiet couple dinners.`;
    } else if (calcCategory === 'pool') {
      title = `Private Swimming Pool Rent`;
      // Pool rules: min 10 pax or min billing 1500
      const effectivePax = Math.max(poolPax, tariffData.pool_private_rent.min_pax);
      const perHeadCost = effectivePax * tariffData.pool_private_rent.rate_per_head_per_hour * poolHours;
      
      // Ensure min bill
      const finalCost = Math.max(perHeadCost, tariffData.pool_private_rent.min_bill);
      subtotal += finalCost;

      if (poolPax < tariffData.pool_private_rent.min_pax) {
        details.push(`• Guest Charge (Adjusted to min ${tariffData.pool_private_rent.min_pax} pax): ${tariffData.pool_private_rent.min_pax} Pax × ₹${tariffData.pool_private_rent.rate_per_head_per_hour}/hr × ${poolHours} Hour(s) = ₹${perHeadCost}`);
      } else {
        details.push(`• Guest Charge: ${poolPax} Pax × ₹${tariffData.pool_private_rent.rate_per_head_per_hour}/hr × ${poolHours} Hour(s) = ₹${perHeadCost}`);
      }
      
      if (perHeadCost < tariffData.pool_private_rent.min_bill) {
        details.push(`• Minimum Billing Threshold Applied: Raised from ₹${perHeadCost} to ₹${tariffData.pool_private_rent.min_bill}`);
      }

      rules = `⏱️ *Pool Slot Details:*\n• Operation Hours: ${tariffData.pool_private_rent.hours}\n• Maximum Safe Capacity: ${tariffData.pool_private_rent.max_capacity}`;
    } else if (calcCategory === 'park') {
      title = `Children's Adventure Park Entry`;
      const adultCost = parkAdults * tariffData.children_park_entry.adult;
      const kidsCost = parkKids * tariffData.children_park_entry.kid;
      subtotal += adultCost + kidsCost;

      details.push(`• Adults Entry: ${parkAdults} Person(s) × ₹${tariffData.children_park_entry.adult} = ₹${adultCost}`);
      details.push(`• Kids Entry: ${parkKids} Kid(s) × ₹${tariffData.children_park_entry.kid} = ₹${kidsCost}`);
      rules = `⏱️ *Park Operational Rules:*\n• Timings: ${tariffData.children_park_entry.hours}\n• Includes access to swings, trampoline, slides, and deer meadow feeding track.`;
    }

    // Apply Discount
    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percent') {
        discountAmount = Math.round((subtotal * discountValue) / 100);
        details.push(`• Discount Applied (${discountValue}%): -₹${discountAmount}`);
      } else {
        discountAmount = Math.min(discountValue, subtotal);
        details.push(`• Discount Applied (Flat): -₹${discountAmount}`);
      }
    }

    const finalTotal = subtotal - discountAmount;
    const discountLine = discountAmount > 0
      ? `\n• Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n• Discount applied (${discountType === 'percent' ? `${discountValue}%` : `₹${discountValue}`}): -₹${discountAmount.toLocaleString('en-IN')}`
      : '';

    // Build quotation message
    const formattedQuotation = `🌟 *MGH RESORT - OFFICIAL QUOTATION* 🌟
------------------------------------
📋 *Facility:* ${title}
💰 *Currency:* INR (₹)

*Cost Estimation Breakdown:*
${details.join('\n')}
------------------------------------
💎 *Estimated Total Amount: ₹${finalTotal.toLocaleString('en-IN')}*${discountLine}

${rules}

📞 _For customized corporate retreat plans or fast confirmations, please let us know!_`;

    return { total: finalTotal, text: formattedQuotation, details };
  };

  const calcResult = calculateResult();

  const handleCopy = () => {
    navigator.clipboard.writeText(calcResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            Resort Tariff Guide <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">INR Rates</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse live cottage, camping, pool, and gazebo tariffs or calculate custom estimates to send instantly to clients.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('view')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'view' ? 'bg-teal-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen size={14} /> Tariff Cards
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'calculator' ? 'bg-teal-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator size={14} /> Live Quote Calculator
          </button>
        </div>
      </div>

      {activeSubTab === 'view' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room & Cottage Cards */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
                <Trees size={16} className="text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-mono">Room & Cottage Accommodations</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tariffData.room_tariffs.map((room, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-200">{room.type}</h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                            👤 {room.capacity}
                          </span>
                        </div>
                        {room.notes && (
                          <p className="text-[10px] text-teal-400 font-mono mt-1.5 bg-teal-950/20 px-2 py-1 rounded border border-teal-500/10">
                            💡 {room.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between items-end">
                        {room.package_rate ? (
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Package Rate</span>
                            <span className="text-sm font-mono font-bold text-teal-400">₹{room.package_rate.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="text-[9px] font-mono text-slate-500 uppercase block">Weekday</span>
                              <span className="text-xs font-mono font-semibold text-slate-300">₹{room.weekday?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-mono text-slate-500 uppercase block">Weekend / Holiday</span>
                              <span className="text-xs font-mono font-semibold text-teal-300">₹{room.weekend_holiday?.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Tents Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
                <Tent size={16} className="text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-mono">Event Tents & Gathering Arenas</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Cleaning Fees</span>
                    <span className="font-semibold text-slate-300">₹{tariffData.event_tents.cleaning_fee}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Extra Hour (&lt; 100 pax)</span>
                    <span className="font-semibold text-slate-300">₹{tariffData.event_tents.extra_hour_under_100pax} / hr</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Extra Hour (&gt; 100 pax)</span>
                    <span className="font-semibold text-slate-300">₹{tariffData.event_tents.extra_hour_over_100pax} / hr</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-850 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono">
                        <th className="p-3">Pax Tier</th>
                        <th className="p-3">Slot 1 (9 AM - 4 PM)</th>
                        <th className="p-3">Slot 2 (3 PM - 8 PM)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                      {tariffData.event_tents.rates_by_pax.map((rate, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/40">
                          <td className="p-3 font-semibold text-slate-200">{rate.pax}</td>
                          <td className="p-3 font-mono text-teal-400">₹{rate.slot_1.toLocaleString('en-IN')}</td>
                          <td className="p-3 font-mono text-emerald-400">₹{rate.slot_2.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Other Facilities & Rules */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stay Rules Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
                <Clock size={16} className="text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-mono">Official Stay Rules</h3>
              </div>
              <div className="p-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Check-In</span>
                    <span className="font-semibold text-slate-200 font-mono">{tariffData.stay_rules.check_in}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Check-Out</span>
                    <span className="font-semibold text-slate-200 font-mono">{tariffData.stay_rules.check_out}</span>
                  </div>
                </div>

                <div className="bg-teal-950/10 border border-teal-900/30 p-3 rounded-xl flex items-start gap-2.5">
                  <Utensils size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-teal-300 font-medium">
                    <strong className="block text-teal-200 text-xs mb-0.5">Inclusions</strong>
                    {tariffData.stay_rules.includes}
                  </div>
                </div>

                <div className="divide-y divide-slate-850 pt-1 text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Extra Bed (Adult)</span>
                    <span className="font-mono font-semibold text-slate-200">₹{tariffData.stay_rules.extra_bed_adult}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Extra Bed (Child)</span>
                    <span className="font-mono font-semibold text-slate-200">₹{tariffData.stay_rules.extra_bed_child}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Visitor (No Stay)</span>
                    <span className="font-mono font-semibold text-slate-200">₹{tariffData.stay_rules.visitor_no_stay}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Miscellaneous Facilities */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
                <Waves size={16} className="text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-mono">Activity Rentals</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Private Pool */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Private Pool Rental
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded">
                      ₹{tariffData.pool_private_rent.rate_per_head_per_hour}/hr/head
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Min bill ₹{tariffData.pool_private_rent.min_bill} (min {tariffData.pool_private_rent.min_pax} pax). Capacity max {tariffData.pool_private_rent.max_capacity}. Active: {tariffData.pool_private_rent.hours}.
                  </p>
                </div>

                <hr className="border-slate-850" />

                {/* Gazebo */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Small Group Gazebo
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded">
                      ₹{tariffData.gazebo_small_groups.rate_per_head}/head
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Limit {tariffData.gazebo_small_groups.pax_limit} pax. Cleaning fee ₹{tariffData.gazebo_small_groups.cleaning_fee}. Perfect for secluded parties and quiet forest dine-ins.
                  </p>
                </div>

                <hr className="border-slate-850" />

                {/* Kids Park */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Kids Adventure Park
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded">
                      Active: {tariffData.children_park_entry.hours}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono text-slate-300">
                    <div className="bg-slate-950 px-2 py-1.5 rounded border border-slate-850">Adult: ₹{tariffData.children_park_entry.adult}</div>
                    <div className="bg-slate-950 px-2 py-1.5 rounded border border-slate-850">Kid: ₹{tariffData.children_park_entry.kid}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Calculator Configuration */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase">Select Facility Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'room', label: 'Cottages', icon: Trees },
                    { id: 'event', label: 'Event Tents', icon: Tent },
                    { id: 'gazebo', label: 'Gazebo', icon: Compass },
                    { id: 'pool', label: 'Pool Rent', icon: Waves },
                    { id: 'park', label: 'Park Entry', icon: Info }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCalcCategory(cat.id as any)}
                        className={`py-3.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all border ${
                          calcCategory === cat.id
                            ? 'bg-teal-500/10 border-teal-400 text-teal-300 shadow-md shadow-teal-500/5'
                            : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-950/80'
                        }`}
                      >
                        <Icon size={16} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-850" />

              {/* Dynamic Sub-form based on Category */}
              {calcCategory === 'room' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 uppercase">Selected Cottages & Rooms</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRooms([
                          ...selectedRooms,
                          {
                            id: Date.now().toString(),
                            type: 'Deluxe AC',
                            weekdayNights: 1,
                            weekendNights: 0,
                            extraAdults: 0,
                            extraChildren: 0,
                            qty: 1
                          }
                        ]);
                      }}
                      className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-teal-500/10 px-2.5 py-1.5 rounded-lg border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer"
                    >
                      + Add Cottage
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                    {selectedRooms.map((room, idx) => (
                      <div key={room.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3 relative group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">Cottage #{idx + 1}</span>
                          {selectedRooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRooms(selectedRooms.filter(r => r.id !== room.id));
                              }}
                              className="text-red-400 hover:text-red-300 text-[10px] font-mono hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Cottage Type Selection */}
                          <div className="sm:col-span-5">
                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Type</label>
                            <select
                              value={room.type}
                              onChange={(e) => {
                                const updated = [...selectedRooms];
                                updated[idx].type = e.target.value;
                                setSelectedRooms(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer font-semibold"
                            >
                              {tariffData.room_tariffs.map((tariff, tIdx) => (
                                <option key={tIdx} value={tariff.type}>
                                  {tariff.type} ({tariff.capacity})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Qty */}
                          <div className="sm:col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Qty</label>
                            <input
                              type="number"
                              min={1}
                              value={room.qty}
                              onChange={(e) => {
                                const updated = [...selectedRooms];
                                updated[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                                setSelectedRooms(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500 font-mono text-center font-bold"
                            />
                          </div>

                          {/* Weekday Nights */}
                          <div className="sm:col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Weekday</label>
                            <input
                              type="number"
                              min={0}
                              value={room.weekdayNights}
                              onChange={(e) => {
                                const updated = [...selectedRooms];
                                updated[idx].weekdayNights = Math.max(0, parseInt(e.target.value) || 0);
                                setSelectedRooms(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500 font-mono text-center"
                            />
                          </div>

                          {/* Weekend Nights */}
                          <div className="sm:col-span-3">
                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Weekend / Hol</label>
                            <input
                              type="number"
                              min={0}
                              value={room.weekendNights}
                              onChange={(e) => {
                                const updated = [...selectedRooms];
                                updated[idx].weekendNights = Math.max(0, parseInt(e.target.value) || 0);
                                setSelectedRooms(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500 font-mono text-center"
                            />
                          </div>
                        </div>

                        {/* Extra Bed Fields for this specific Cottage Row */}
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-900">
                          <div>
                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Extra Adult Beds (₹600/night)</label>
                            <input
                              type="number"
                              min={0}
                              value={room.extraAdults}
                              onChange={(e) => {
                                const updated = [...selectedRooms];
                                updated[idx].extraAdults = Math.max(0, parseInt(e.target.value) || 0);
                                setSelectedRooms(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Extra Kid Beds (₹300/night)</label>
                            <input
                              type="number"
                              min={0}
                              value={room.extraChildren}
                              onChange={(e) => {
                                const updated = [...selectedRooms];
                                updated[idx].extraChildren = Math.max(0, parseInt(e.target.value) || 0);
                                setSelectedRooms(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* General Visitor charges */}
                  <div className="pt-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">General Visitors (No stay - ₹250/person)</label>
                    <input
                      type="number"
                      min={0}
                      value={visitorsNoStay}
                      onChange={(e) => setVisitorsNoStay(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {calcCategory === 'event' && (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Pax Capacity Tier</label>
                      <select
                        value={eventPax}
                        onChange={(e) => setEventPax(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500 cursor-pointer font-semibold"
                      >
                        {tariffData.event_tents.rates_by_pax.map((tier, idx) => (
                          <option key={idx} value={tier.pax}>{tier.pax} Guests</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Booking Slot Duration</label>
                      <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
                        <button
                          onClick={() => setEventSlot('slot_1')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                            eventSlot === 'slot_1' ? 'bg-teal-600 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          9AM-4PM
                        </button>
                        <button
                          onClick={() => setEventSlot('slot_2')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                            eventSlot === 'slot_2' ? 'bg-teal-600 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          3PM-8PM
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Extra Hours Needed</label>
                    <input
                      type="number"
                      min={0}
                      value={eventExtraHours}
                      onChange={(e) => setEventExtraHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 font-mono ml-2">Hourly extra fee applies dynamically</span>
                  </div>
                </div>
              )}

              {calcCategory === 'gazebo' && (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Number of Persons</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={gazeboPax}
                        onChange={(e) => setGazeboPax(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">
                        {gazeboPax > 20 ? '⚠️ Exceeds Gazebo small group limit (Max 20)' : '✅ Within safe seating limits'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {calcCategory === 'pool' && (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Number of Swimmers (Pax)</label>
                      <input
                        type="number"
                        min={1}
                        value={poolPax}
                        onChange={(e) => setPoolPax(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">Minimum billing of 10 pax (₹1,500) applies</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Hours of Use</label>
                      <input
                        type="number"
                        min={1}
                        value={poolHours}
                        onChange={(e) => setPoolHours(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {calcCategory === 'park' && (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Adult Count</label>
                      <input
                        type="number"
                        min={0}
                        value={parkAdults}
                        onChange={(e) => setParkAdults(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">Kids Count</label>
                      <input
                        type="number"
                        min={0}
                        value={parkKids}
                        onChange={(e) => setParkKids(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="pt-4 border-t border-slate-850 space-y-2 text-left mt-4">
              <label className="text-xs font-mono text-slate-400 uppercase">Apply Quotation Discount</label>
              <div className="flex gap-2">
                <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl max-w-[150px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      discountType === 'percent' ? 'bg-teal-600 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      discountType === 'flat' ? 'bg-teal-600 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Flat (₹)
                  </button>
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs">
                    {discountType === 'percent' ? '%' : '₹'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-start gap-2.5 mt-6">
              <Info size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Calculations are modeled from official resort stay parameters and seasonal surcharges. All computed tariffs are subject to resort terms and layout booking availability.
              </p>
            </div>
          </div>

          {/* Right Column: Calculated Quote Result Display */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  Calculation Screen
                </span>
                <h4 className="text-xs font-bold text-slate-100 mt-1 font-mono">Live Price Breakdown</h4>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono text-slate-500 block">TOTAL ESTIMATE</span>
                <span className="text-base font-mono font-bold text-teal-400">₹{calcResult.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-4 text-left">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Invoiced Elements</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                  {calcResult.details.map((det, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 text-xs font-medium text-slate-300 flex justify-between">
                      <span>{det.split('=')[0]}</span>
                      <span className="font-mono text-teal-400 font-bold">{det.split('=')[1] || ''}</span>
                    </div>
                  ))}
                  {calcResult.details.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center font-semibold">Select stays or options to see calculation details.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">WhatsApp Clipboard Ready Text</span>
                <textarea
                  readOnly
                  value={calcResult.text}
                  className="w-full bg-slate-950 border border-slate-850 text-[11px] text-slate-300 rounded-xl p-3 h-48 focus:outline-none font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl py-2.5 text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
              >
                {copied ? <Check size={14} className="animate-bounce" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
