import React, { useState, useEffect } from 'react';
import {
  NavTab,
  Festival,
  FestivalMedia,
  FestivalDeity,
} from '../types';
import { supabase } from '../lib/supabase';
import { cache } from '../lib/cache';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface FestivalWithMedia extends Festival {
  thumbnail?: FestivalMedia;
  primary_deity?: FestivalDeity;
}

type FestivalType =
  | 'All'
  | 'Major Festival'
  | 'Ekadashi'
  | 'Purnima'
  | 'Amavasya'
  | 'Jayanti'
  | 'Vrata'
  | 'Utsava'
  | 'Other';

interface FestivalsListViewProps {
  onTabChange: (tab: NavTab) => void;
  onSelectFestival: (festivalId: string) => void;
}

const FESTIVAL_TYPES: FestivalType[] = [
  'All',
  'Major Festival',
  'Ekadashi',
  'Purnima',
  'Amavasya',
  'Jayanti',
  'Vrata',
  'Utsava',
  'Other',
];

export const FestivalsListView: React.FC<FestivalsListViewProps> = ({
  onTabChange,
  onSelectFestival,
}) => {
  const [festivals, setFestivals] = useState<FestivalWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] =
    useState<FestivalType>('All');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    setLoading(true);
    setError(null);

    try {
      // ------------------------------------------------
      // KEEP EXISTING CACHE LOGIC
      // ------------------------------------------------
      const cacheKey = 'festivals_list';

      const cached =
        cache.get<FestivalWithMedia[]>(cacheKey);

      if (cached) {
        setFestivals(cached);
        setLoading(false);
        return;
      }

      // ------------------------------------------------
      // KEEP EXISTING FESTIVAL DB QUERY
      // ------------------------------------------------
      const {
        data: festivalData,
        error: festivalError,
      } = await supabase
        .from('festivals')
        .select(
          'id, name, alternate_name, festival_type, short_description, festival_date, start_date, end_date, status'
        )
        .eq('status', 'Published')
        .order('festival_date', {
          ascending: true,
        });

      if (festivalError) throw festivalError;

      if (!festivalData) {
        setFestivals([]);
        setLoading(false);
        return;
      }

      // ------------------------------------------------
      // KEEP EXISTING MEDIA + DEITY FETCHING
      // ------------------------------------------------
      const enrichedFestivals = await Promise.all(
        festivalData.map(async festival => {
          const { data: mediaData } = await supabase
            .from('festival_media')
            .select(
              'id, festival_id, media_type, storage_key, public_url, file_name, display_order'
            )
            .eq('festival_id', festival.id)
            .in('media_type', [
              'thumbnail',
              'banner',
            ])
            .order('display_order', {
              ascending: true,
            })
            .limit(1)
            .maybeSingle();

          const { data: deityData } = await supabase
            .from('festival_deities')
            .select(
              'id, festival_id, deity_name, deity_image_url, deity_description, is_primary, sort_order'
            )
            .eq('festival_id', festival.id)
            .eq('is_primary', true)
            .limit(1)
            .maybeSingle();

          return {
            ...festival,
            thumbnail: mediaData || undefined,
            primary_deity:
              deityData || undefined,
          };
        })
      );

      setFestivals(enrichedFestivals);
      cache.set(
        cacheKey,
        enrichedFestivals
      );
    } catch (err) {
      console.error(
        'Error fetching festivals:',
        err
      );

      setError(
        'Failed to load festivals. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // KEEP EXISTING FILTER LOGIC
  // ------------------------------------------------
  const filteredFestivals =
    festivals.filter(festival => {
      const matchesSearch =
        festival.name
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          ) ||
        festival.alternate_name
          ?.toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          );

      const matchesType =
        selectedType === 'All' ||
        festival.festival_type ===
          selectedType;

      return (
        matchesSearch && matchesType
      );
    });

  // ------------------------------------------------
  // DATE FORMATTER
  // ------------------------------------------------
  const formatDate = (
    dateStr?: string
  ) => {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);

      return date.toLocaleDateString(
        'en-IN',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      );
    } catch {
      return dateStr;
    }
  };

  // ------------------------------------------------
  // DISPLAY START → END DATE
  // ------------------------------------------------
  const getFestivalDate = (
    festival: FestivalWithMedia
  ) => {
    if (
      festival.start_date &&
      festival.end_date &&
      festival.start_date !==
        festival.end_date
    ) {
      return `${formatDate(
        festival.start_date
      )} – ${formatDate(
        festival.end_date
      )}`;
    }

    if (festival.festival_date) {
      return formatDate(
        festival.festival_date
      );
    }

    if (festival.start_date) {
      return formatDate(
        festival.start_date
      );
    }

    return '';
  };

  return (
    <>
    <div
      className="
        relative
        mx-auto
        min-h-screen
        max-w-lg
        overflow-x-hidden
        bg-[#080806]
        pb-36
        pt-20
        text-[#EAD9BC]
      "
    >
      {/* ================================================ */}
      {/* BACKGROUND DECORATION */}
      {/* ================================================ */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          mx-auto
          max-w-lg
          overflow-hidden
        "
      >
        {/* Top amber glow */}
        <div
          className="
            absolute
            -top-32
            left-1/2
            h-[360px]
            w-[360px]
            -translate-x-1/2
            rounded-full
            bg-[#8D4E13]/15
            blur-[100px]
          "
        />

        {/* Center subtle glow */}
        <div
          className="
            absolute
            top-[45%]
            -right-40
            h-[320px]
            w-[320px]
            rounded-full
            bg-[#C47A25]/5
            blur-[110px]
          "
        />

        {/* Bottom glow */}
        <div
          className="
            absolute
            bottom-0
            -left-36
            h-[300px]
            w-[300px]
            rounded-full
            bg-[#B86C18]/5
            blur-[100px]
          "
        />

        {/* Sacred subtle texture */}
        <div
          className="
            absolute
            inset-0
            opacity-[0.035]
          "
          style={{
            backgroundImage: `
              radial-gradient(circle at center, #D79A48 1px, transparent 1px)
            `,
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* ================================================ */}
        {/* EXISTING HEADER */}
        {/* ================================================ */}

        <Header
          title="FESTIVALS"
          onNotificationClick={() => {}}
          onTabChange={onTabChange}
        />

        {/* ================================================ */}
        {/* PAGE INTRO */}
        {/* ================================================ */}

        <section className="px-5 pb-5 pt-1 text-center">
          <div
            className="
              mx-auto
              flex
              max-w-[320px]
              items-center
              justify-center
              gap-3
            "
          >
            <div
              className="
                h-px
                flex-1
                bg-gradient-to-r
                from-transparent
                via-[#A66B2D]/50
                to-[#C58B43]/30
              "
            />

            <span
              className="
                text-[10px]
                text-[#D89B4B]
              "
            >
              ✦
            </span>

            <p
              className="
                whitespace-nowrap
                font-serif-main
                text-[13px]
                tracking-[0.04em]
                text-[#DDBA7E]
              "
            >
              Celebrate the Divine Moments
            </p>

            <span
              className="
                text-[10px]
                text-[#D89B4B]
              "
            >
              ✦
            </span>

            <div
              className="
                h-px
                flex-1
                bg-gradient-to-l
                from-transparent
                via-[#A66B2D]/50
                to-[#C58B43]/30
              "
            />
          </div>
        </section>

        {/* ================================================ */}
        {/* SEARCH */}
        {/* ================================================ */}

        <section className="mb-4 px-4">
          <div
            className="
              relative
              flex
              items-center
              overflow-hidden
              rounded-full
              border
              border-[#A66B2D]/25
              bg-[#15110C]/75
              shadow-[inset_0_1px_0_rgba(255,196,107,0.05)]
              backdrop-blur-xl
            "
          >
            <svg
              className="
                absolute
                left-4
                h-[17px]
                w-[17px]
                text-[#D9A659]/55
              "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path d="M21 21l-4.35-4.35" />
            </svg>

            <input
              type="text"
              value={searchQuery}
              onChange={e =>
                setSearchQuery(
                  e.target.value
                )
              }
              placeholder="Search festivals..."
              className="
                w-full
                bg-transparent
                py-3
                pl-11
                pr-4
                text-[13px]
                text-[#E7D7BA]
                outline-none
                placeholder:text-[#A99678]/45
              "
            />
          </div>
        </section>

        {/* ================================================ */}
        {/* FESTIVAL FILTERS */}
        {/* ================================================ */}

        <section
          className="
            sticky
            top-[63px]
            z-40
            mb-5
            bg-[#080806]/90
            px-4
            py-1
            backdrop-blur-xl
          "
        >
          <div
            className="
              no-scrollbar
              flex
              gap-2
              overflow-x-auto
              pb-2
            "
          >
            {FESTIVAL_TYPES.map(
              type => {
                const active =
                  selectedType === type;

                return (
                  <button
                    key={type}
                    onClick={() =>
                      setSelectedType(
                        type
                      )
                    }
                    className={`
                      flex-shrink-0
                      rounded-full
                      border
                      px-4
                      py-[7px]
                      text-[10px]
                      tracking-[0.08em]
                      transition-all
                      duration-300
                      ${
                        active
                          ? `
                            border-[#B77B32]/65
                            bg-gradient-to-r
                            from-[#5C3615]
                            via-[#70441C]
                            to-[#513014]
                            text-[#F0C984]
                            shadow-[0_4px_18px_rgba(166,100,30,0.14)]
                          `
                          : `
                            border-[#705027]/25
                            bg-[#14100B]/70
                            text-[#A99577]/60
                            hover:border-[#B77B32]/40
                            hover:text-[#D8AD6B]
                          `
                      }
                    `}
                  >
                    {type}
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* ================================================ */}
        {/* ERROR */}
        {/* ================================================ */}

        {error && (
          <div className="mx-4 mb-5 rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-[12px] text-red-300">
            {error}

            <button
              onClick={fetchFestivals}
              className="ml-2 font-semibold text-[#F0B95D] underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ================================================ */}
        {/* LOADING SKELETON */}
        {/* ================================================ */}

        {loading && (
          <div className="space-y-3 px-4">
            {[...Array(4)].map(
              (_, i) => (
                <div
                  key={i}
                  className="
                    flex
                    h-[158px]
                    animate-pulse
                    overflow-hidden
                    rounded-[18px]
                    border
                    border-[#7B562E]/20
                    bg-[#12100C]
                    p-2
                  "
                >
                  <div
                    className="
                      h-full
                      w-[43%]
                      rounded-[14px]
                      bg-[#211B14]
                    "
                  />

                  <div
                    className="
                      flex-1
                      space-y-3
                      px-4
                      py-3
                    "
                  >
                    <div className="h-4 w-3/4 rounded bg-[#241C13]" />
                    <div className="h-3 w-1/2 rounded bg-[#241C13]" />
                    <div className="h-3 w-full rounded bg-[#241C13]" />
                    <div className="h-3 w-4/5 rounded bg-[#241C13]" />
                    <div className="h-8 w-full rounded-full bg-[#241C13]" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ================================================ */}
        {/* FESTIVAL LIST */}
        {/* ================================================ */}

        {!loading && (
          <section className="px-3 sm:px-4">
            {filteredFestivals.length ===
            0 ? (
              <div
                className="
                  flex
                  min-h-[300px]
                  flex-col
                  items-center
                  justify-center
                  px-6
                  text-center
                "
              >
                <div
                  className="
                    mb-4
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#A76D2C]/25
                    bg-[#1B140C]
                    text-2xl
                    text-[#D89A45]
                  "
                >
                  ॐ
                </div>

                <p
                  className="
                    font-cinzel
                    text-[17px]
                    text-[#D8B879]
                  "
                >
                  No Festivals Found
                </p>

                <p
                  className="
                    mt-2
                    max-w-[240px]
                    text-xs
                    leading-relaxed
                    text-[#9F8E73]/60
                  "
                >
                  Try searching another
                  festival or selecting a
                  different category.
                </p>
              </div>
            ) : (
              <div className="space-y-[10px]">
                {filteredFestivals.map(
                  festival => (
                    <article
                      key={festival.id}
                      onClick={() =>
                        onSelectFestival(
                          festival.id
                        )
                      }
                      className="
                        group
                        relative
                        flex
                        min-h-[162px]
                        cursor-pointer
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-[#8A5C2C]/35
                        bg-gradient-to-br
                        from-[#17120D]
                        via-[#100E0B]
                        to-[#0B0A08]
                        p-[6px]
                        shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(233,178,96,0.035)]
                        transition-all
                        duration-300
                        hover:border-[#C1843D]/55
                        active:scale-[0.985]
                      "
                    >
                      {/* -------------------------------- */}
                      {/* IMAGE LEFT */}
                      {/* -------------------------------- */}

                      <div
                        className="
                          relative
                          w-[43%]
                          flex-shrink-0
                          overflow-hidden
                          rounded-[15px]
                          bg-[#1B140C]
                        "
                      >
                        {festival.thumbnail
                          ?.public_url ? (
                          <img
                            src={
                              festival
                                .thumbnail
                                .public_url
                            }
                            alt={
                              festival.name
                            }
                            loading="lazy"
                            className="
                              absolute
                              inset-0
                              h-full
                              w-full
                              object-cover
                              transition-transform
                              duration-700
                              group-hover:scale-[1.06]
                            "
                          />
                        ) : festival
                            .primary_deity
                            ?.deity_image_url ? (
                          <img
                            src={
                              festival
                                .primary_deity
                                .deity_image_url
                            }
                            alt={
                              festival
                                .primary_deity
                                .deity_name
                            }
                            loading="lazy"
                            className="
                              absolute
                              inset-0
                              h-full
                              w-full
                              object-cover
                              transition-transform
                              duration-700
                              group-hover:scale-[1.06]
                            "
                          />
                        ) : (
                          <div
                            className="
                              absolute
                              inset-0
                              flex
                              items-center
                              justify-center
                              bg-gradient-to-br
                              from-[#503017]
                              via-[#24170E]
                              to-[#0C0A08]
                            "
                          >
                            <div
                              className="
                                absolute
                                h-28
                                w-28
                                rounded-full
                                bg-[#E39A35]/10
                                blur-3xl
                              "
                            />

                            <span
                              className="
                                relative
                                font-serif-main
                                text-4xl
                                text-[#C88736]/55
                              "
                            >
                              ॐ
                            </span>
                          </div>
                        )}

                        {/* Warm photo tint */}
                        <div
                          className="
                            absolute
                            inset-0
                            bg-gradient-to-tr
                            from-[#160B02]/25
                            via-transparent
                            to-[#E29230]/5
                          "
                        />

                        {/* Image bottom shade */}
                        <div
                          className="
                            absolute
                            inset-x-0
                            bottom-0
                            h-1/2
                            bg-gradient-to-t
                            from-black/45
                            to-transparent
                          "
                        />

                        {/* Inner golden frame */}
                        <div
                          className="
                            pointer-events-none
                            absolute
                            inset-0
                            rounded-[15px]
                            border
                            border-[#D59849]/10
                          "
                        />
                      </div>

                      {/* -------------------------------- */}
                      {/* CONTENT RIGHT */}
                      {/* -------------------------------- */}

                      <div
                        className="
                          flex
                          min-w-0
                          flex-1
                          flex-col
                          px-3
                          pb-2
                          pt-2
                          sm:px-4
                        "
                      >
                        {/* Festival Name */}
                        <h3
                          className="
                            line-clamp-1
                            font-cinzel
                            text-[17px]
                            font-semibold
                            leading-tight
                            tracking-[0.01em]
                            text-[#E8C68B]
                            transition-colors
                            group-hover:text-[#F4D9A8]
                            sm:text-[19px]
                          "
                        >
                          {festival.name}
                        </h3>

                        {/* Alternate Name */}
                        {festival.alternate_name && (
                          <p
                            className="
                              mt-[2px]
                              line-clamp-1
                              font-serif-main
                              text-[10px]
                              italic
                              text-[#BCA47F]/55
                            "
                          >
                            {
                              festival.alternate_name
                            }
                          </p>
                        )}

                        {/* DATE */}
                        {getFestivalDate(
                          festival
                        ) && (
                          <div
                            className="
                              mt-2
                              flex
                              items-center
                              gap-2
                              text-[#D3B07A]
                            "
                          >
                            <svg
                              className="
                                h-[15px]
                                w-[15px]
                                flex-shrink-0
                                text-[#D88B33]
                              "
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="5"
                                width="18"
                                height="16"
                                rx="2"
                              />
                              <path d="M16 3v4M8 3v4M3 10h18" />
                              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                            </svg>

                            <span
                              className="
                                line-clamp-1
                                text-[11px]
                                font-medium
                              "
                            >
                              {getFestivalDate(
                                festival
                              )}
                            </span>
                          </div>
                        )}

                        {/* DESCRIPTION */}
                        {festival.short_description && (
                          <div
                            className="
                              mt-2
                              flex
                              min-w-0
                              items-start
                              gap-2
                            "
                          >
                            <svg
                              className="
                                mt-[2px]
                                h-[14px]
                                w-[14px]
                                flex-shrink-0
                                text-[#D88B33]
                              "
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 3c-1.3 2.5-3.5 4-6 4 0 6.5 2.2 10.4 6 14 3.8-3.6 6-7.5 6-14-2.5 0-4.7-1.5-6-4Z" />
                              <path d="M9.5 11.5 11 13l3.5-4" />
                            </svg>

                            <p
                              className="
                                line-clamp-3
                                text-[11px]
                                leading-[1.45]
                                text-[#CBB99D]/72
                                sm:text-[12px]
                              "
                            >
                              {
                                festival.short_description
                              }
                            </p>
                          </div>
                        )}

                        {/* TYPE / DEITY MINI META */}
                        <div
                          className="
                            mt-auto
                            flex
                            items-center
                            gap-2
                            pt-2
                          "
                        >
                          {festival.primary_deity && (
                            <div
                              className="
                                flex
                                min-w-0
                                items-center
                                gap-1.5
                              "
                            >
                              {festival
                                .primary_deity
                                .deity_image_url && (
                                <img
                                  src={
                                    festival
                                      .primary_deity
                                      .deity_image_url
                                  }
                                  alt={
                                    festival
                                      .primary_deity
                                      .deity_name
                                  }
                                  loading="lazy"
                                  className="
                                    h-5
                                    w-5
                                    flex-shrink-0
                                    rounded-full
                                    border
                                    border-[#AF7735]/35
                                    object-cover
                                  "
                                />
                              )}

                              <span
                                className="
                                  max-w-[80px]
                                  truncate
                                  text-[9px]
                                  text-[#B99E73]/50
                                "
                              >
                                {
                                  festival
                                    .primary_deity
                                    .deity_name
                                }
                              </span>
                            </div>
                          )}

                          <span
                            className="
                              ml-auto
                              max-w-[95px]
                              truncate
                              rounded-full
                              border
                              border-[#98642D]/20
                              bg-[#9D6328]/5
                              px-2
                              py-[3px]
                              text-[8px]
                              tracking-[0.04em]
                              text-[#BFA16E]/45
                            "
                          >
                            {
                              festival.festival_type
                            }
                          </span>
                        </div>

                        {/* READ MORE */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();

                            onSelectFestival(
                              festival.id
                            );
                          }}
                          className="
                            mt-2
                            flex
                            h-[34px]
                            w-full
                            items-center
                            justify-center
                            gap-4
                            rounded-full
                            border
                            border-[#A56C30]/30
                            bg-gradient-to-r
                            from-[#2A190C]
                            via-[#382211]
                            to-[#27170B]
                            px-4
                            font-serif-main
                            text-[12px]
                            tracking-[0.01em]
                            text-[#E1B979]
                            shadow-[inset_0_1px_0_rgba(255,201,118,0.06)]
                            transition-all
                            duration-300
                            hover:border-[#C1843E]/55
                            hover:text-[#F4D49E]
                            active:scale-[0.97]
                          "
                        >
                          <span>
                            Read More
                          </span>

                          <svg
                            className="
                              h-4
                              w-4
                              transition-transform
                              duration-300
                              group-hover:translate-x-1
                            "
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="m13 6 6 6-6 6" />
                          </svg>
                        </button>
                      </div>

                      {/* Card subtle corner glow */}
                      <div
                        className="
                          pointer-events-none
                          absolute
                          -right-12
                          -top-16
                          h-28
                          w-28
                          rounded-full
                          bg-[#D38A30]/[0.025]
                          blur-2xl
                        "
                      />
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
    <BottomNav currentTab="festivals" onTabChange={onTabChange} />
    </>
  );
};