import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { FunctionComponent, ReactNode } from "react";

import { PriceChange } from "~/components/assets/price";
import { SkeletonLoader } from "~/components/loaders/skeleton-loader";
import { EventName } from "~/config";
import {
  Breakpoint,
  useAmplitudeAnalytics,
  useTranslation,
  useWindowSize,
} from "~/hooks";
import { api, RouterOutputs } from "~/utils/trpc";

import { CustomClasses } from "../types";

type PriceChange24hAsset =
  | RouterOutputs["edge"]["assets"]["getTopNewAssets"][number]
  | RouterOutputs["edge"]["assets"]["getTopGainerAssets"][number];

type UpcomingReleaseAsset =
  RouterOutputs["edge"]["assets"]["getTopUpcomingAssets"][number];

type Highlight = "new" | "topGainers" | "upcoming";

type HighlightsProps = {
  isCategorySelected: boolean;
  onSelectAllTopGainers: () => void;
} & CustomClasses;

export const HighlightsCategories: FunctionComponent<HighlightsProps> = (
  props
) => {
  if (props.isCategorySelected) return null;

  return <HighlightsGrid {...props} />;
};

const HighlightsGrid: FunctionComponent<HighlightsProps> = ({
  onSelectAllTopGainers,
  className,
}) => {
  const { t } = useTranslation();
  const { width } = useWindowSize();

  const isLargeTablet = width < Breakpoint.xl && width > Breakpoint.lg;

  const { data: topNewAssets, isLoading: isTopNewAssetsLoading } =
    api.edge.assets.getTopNewAssets.useQuery({
      topN: isLargeTablet ? 3 : undefined,
    });
  const { data: topGainerAssets, isLoading: isTopGainerAssetsLoading } =
    api.edge.assets.getTopGainerAssets.useQuery({
      topN: isLargeTablet ? 8 : undefined,
    });
  const { data: topUpcomingAssets, isLoading: isTopUpcomingAssetsLoading } =
    api.edge.assets.getTopUpcomingAssets.useQuery({
      topN: isLargeTablet ? 3 : undefined,
    });

  return (
    <div
      className={classNames(
        "lg:no-scrollbar grid grid-cols-3 gap-6 xl:grid-cols-2 xl:grid-rows-2 xl:gap-8 lg:flex lg:snap-x lg:snap-mandatory lg:overflow-x-scroll",
        className
      )}
    >
      <AssetHighlights
        className="lg:w-[80%] lg:shrink-0 lg:snap-center"
        title={t("assets.highlights.new")}
        isLoading={isTopNewAssetsLoading}
        assets={(topNewAssets ?? []).map(highlightPrice24hChangeAsset)}
        highlight="new"
      />
      <AssetHighlights
        className="xl:row-span-2 lg:row-auto lg:w-[80%] lg:shrink-0 lg:snap-center"
        title={t("assets.highlights.topGainers")}
        subtitle="24h"
        isLoading={isTopGainerAssetsLoading}
        assets={(topGainerAssets ?? []).map(highlightPrice24hChangeAsset)}
        onClickSeeAll={onSelectAllTopGainers}
        highlight="topGainers"
      />
      <AssetHighlights
        className="lg:w-[80%] lg:shrink-0 lg:snap-center"
        title={t("assets.highlights.upcoming")}
        isLoading={isTopUpcomingAssetsLoading}
        assets={(topUpcomingAssets ?? []).map(highlightUpcomingReleaseAsset)}
        highlight="upcoming"
      />
    </div>
  );
};

export function highlightPrice24hChangeAsset(asset: PriceChange24hAsset) {
  return {
    asset: {
      ...asset,
      href: `/assets/${asset.coinDenom}`,
    },
    extraInfo: asset.priceChange24h ? (
      <PriceChange
        priceChange={asset.priceChange24h}
        overrideTextClasses="body2"
        className="h-fit"
      />
    ) : null,
  };
}

function highlightUpcomingReleaseAsset(asset: UpcomingReleaseAsset) {
  // Format the date to "Est. MMM YYYY" format
  const formatDateText = (dateText: string | undefined) => {
    if (!dateText) return null;

    // Handle different date formats
    let formattedDate = dateText;

    // Convert month names to 3-letter codes with proper capitalization
    const monthMap: { [key: string]: string } = {
      January: "Jan",
      February: "Feb",
      March: "Mar",
      April: "Apr",
      May: "May",
      June: "Jun",
      July: "Jul",
      August: "Aug",
      September: "Sep",
      October: "Oct",
      November: "Nov",
      December: "Dec",
    };

    // Replace full month names with 3-letter codes (case-insensitive)
    Object.entries(monthMap).forEach(([full, short]) => {
      formattedDate = formattedDate.replace(
        new RegExp(`\\b${full}\\b`, "gi"),
        short
      );
    });

    return formattedDate;
  };

  return {
    asset: {
      coinDenom: asset.symbol,
      coinName: asset.assetName,
      coinImageUrl: asset.images[0].png ?? asset.images[0].svg,
      href: asset.socials?.website,
      externalLink: true,
    },
    extraInfo: asset.estimatedLaunchDateUtc ? (
      <div className="flex items-center gap-2 min-w-0">
        <span className="body2 text-osmoverse-400 whitespace-nowrap">
          Est. {formatDateText(asset.estimatedLaunchDateUtc)}
        </span>
      </div>
    ) : null,
  };
}

export const AssetHighlights: FunctionComponent<
  {
    title: string;
    subtitle?: string;
    onClickSeeAll?: () => void;
    assets: {
      asset: {
        coinDenom: string;
        coinName: string;
        coinImageUrl?: string;
      };
      extraInfo: ReactNode;
    }[];
    isLoading?: boolean;
    disableLinking?: boolean;
    highlight: Highlight;
    onClickAsset?: (asset: HighlightAsset) => void;
  } & CustomClasses
> = ({
  title,
  subtitle,
  onClickSeeAll,
  assets,
  isLoading = false,
  className,
  highlight,
  onClickAsset,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={classNames(
        "flex flex-col border-t border-osmoverse-700 py-3",
        className
      )}
    >
      <div className="flex place-content-between pt-1 pb-3">
        <h6>
          {title}{" "}
          {subtitle && (
            <span className="body1 text-osmoverse-400">{subtitle}</span>
          )}
        </h6>
        {onClickSeeAll && (
          <button className="body2 text-wosmongton-300" onClick={onClickSeeAll}>
            {t("assets.seeAll")}
          </button>
        )}
      </div>
      <div className={classNames("flex flex-col", { "gap-1": isLoading })}>
        {isLoading ? (
          <>
            {new Array(3).fill(0).map((_, i) => (
              <SkeletonLoader className="h-12 w-full" key={i} />
            ))}
          </>
        ) : (
          <>
            {assets.map(({ asset, extraInfo }) => (
              <AssetHighlightRow
                key={asset.coinDenom}
                asset={asset}
                extraInfo={extraInfo}
                highlight={highlight}
                onClick={onClickAsset}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

type HighlightAsset = {
  coinDenom: string;
  coinName: string;
  coinImageUrl?: string;
  href?: string;
  externalLink?: boolean;
};

const AssetHighlightRow: FunctionComponent<{
  asset: HighlightAsset;
  extraInfo: ReactNode;
  highlight: Highlight;
  onClick?: (asset: HighlightAsset) => void;
}> = ({ asset, extraInfo, highlight, onClick }) => {
  const { coinDenom, coinName, coinImageUrl, href, externalLink } = asset;
  const { logEvent } = useAmplitudeAnalytics();

  const AssetContent = (
    <>
      <div className="flex items-center gap-2">
        {coinImageUrl && (
          <Image src={coinImageUrl} alt={coinDenom} height={32} width={32} />
        )}
        <span className="body2 max-w-[7rem] overflow-clip text-ellipsis whitespace-nowrap">
          {coinName}
        </span>
        <span className="caption text-osmoverse-400">{coinDenom}</span>
      </div>
      <div>{extraInfo}</div>
    </>
  );

  return !href ? (
    <div
      className="-mx-2 flex items-center justify-between gap-4 rounded-lg p-2"
      onClick={() => onClick?.(asset)}
    >
      {AssetContent}
    </div>
  ) : (
    <Link
      href={href}
      passHref
      target={externalLink ? "_blank" : "_self"}
      className="-mx-2 flex items-center justify-between gap-4 rounded-lg p-2 transition-colors duration-200 ease-in-out hover:cursor-pointer hover:bg-osmoverse-850"
      onClick={() => {
        logEvent([EventName.Assets.assetClicked, { coinDenom, highlight }]);
        onClick?.(asset);
      }}
    >
      {AssetContent}
    </Link>
  );
};
