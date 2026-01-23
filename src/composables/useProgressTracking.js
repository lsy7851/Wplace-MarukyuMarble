/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Original work Copyright (c) SwingTheVine
 * Derived from works by Hao-1337 and pixelkat5
 * Modified work Copyright (c) Seris0
 * Modified work Copyright (c) 2025 lsy7851 and Marukyu Marble Contributors
 */
import { computed } from 'vue';
import { useTemplateStore } from '@/stores/templateStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Progress Tracking Composable
 *
 * Aggregates pixel statistics from tile progress cache
 * - Calculate per-color statistics
 * - Calculate overall progress
 * - Support "wrong colors count as painted" setting
 * - Filter by enabled templates
 *
 * Reference: old-src/templateManager.js:1620-1890
 */
export function useProgressTracking() {
  const templateStore = useTemplateStore();
  const settingsStore = useSettingsStore();

  /**
   * Calculate per-color statistics for a template
   * @param {Object} template - Template instance
   * @param {boolean} onlyEnabledTemplates - Only include enabled templates in calculation
   * @returns {Object} Per-color statistics {colorKey: {totalRequired, painted, needsCrosshair, percentage, remaining, wrong}}
   */
  function calculateColorStats(template, onlyEnabledTemplates = true) {
    if (!template) return {};

    const colorStats = {};
    const tileProgress = templateStore.tileProgress;
    const includeWrong = settingsStore.enhanceWrongColors || false;

    // Check if we have tile progress data
    if (!tileProgress || tileProgress.size === 0) {
      return getFallbackStats(template);
    }

    // Aggregate painted/wrong/required across tiles
    let totalPainted = 0;
    let totalRequired = 0;
    let totalWrong = 0;
    const realColorStats = {}; // Per-color stats from tile analysis

    // Get enabled template IDs for filtering
    const enabledTemplateIds = onlyEnabledTemplates
      ? new Set(templateStore.templates.filter(t => t.enabled).map(t => t.id))
      : null;

    for (const [tileKey, stats] of tileProgress.entries()) {
      // Filter by enabled templates
      if (onlyEnabledTemplates && enabledTemplateIds) {
        // Extract template ID from tile key if available
        // Tile key format can vary, but we can check if the tile belongs to any enabled template
        let shouldIncludeTile = false;

        for (const t of templateStore.templates) {
          if (!enabledTemplateIds.has(t.id)) continue;

          // Check if this tile intersects with any template tiles
          // This is a simplified check - in reality would need tile coordinate matching
          // For now, include all tiles if any template is enabled
          shouldIncludeTile = true;
          break;
        }

        if (!shouldIncludeTile) continue;
      }

      totalPainted += stats.painted || 0;
      totalRequired += stats.required || 0;
      totalWrong += stats.wrong || 0;

      // Aggregate per-color stats
      if (stats.colorBreakdown) {
        for (const [colorKey, colorData] of Object.entries(stats.colorBreakdown)) {
          if (!realColorStats[colorKey]) {
            realColorStats[colorKey] = { painted: 0, required: 0, wrong: 0 };
          }
          realColorStats[colorKey].painted += colorData.painted || 0;
          realColorStats[colorKey].required += colorData.required || 0;
          realColorStats[colorKey].wrong += colorData.wrong || 0;
        }
      }
    }

    // Build color palette if needed
    const colorPalette = template.colorPalette || {};
    if (Object.keys(colorPalette).length === 0) {
      return {};
    }

    // Calculate per-color statistics
    // NOTE: colorPalette format is {"r,g,b": count} where count is a NUMBER, not an object
    // (created in useImageProcessing.js:61)
    for (const [colorKey, paletteInfo] of Object.entries(colorPalette)) {
      // paletteInfo is a number (pixel count), not an object with {count, enabled}
      const colorCount = typeof paletteInfo === 'number' ? paletteInfo : (paletteInfo?.count || 0);

      let paintedForColor, wrongForColor, needsCrosshair, percentage;

      if (realColorStats[colorKey]) {
        // Use PRECISE data from per-color tile analysis
        paintedForColor = realColorStats[colorKey].painted;
        wrongForColor = realColorStats[colorKey].wrong;

        if (includeWrong) {
          // Include wrong colors in progress (wrong pixels count as "painted")
          const effectivePainted = paintedForColor + wrongForColor;
          const effectiveRequired = realColorStats[colorKey].required;
          needsCrosshair = effectiveRequired - effectivePainted;
          percentage = effectiveRequired > 0
            ? Math.round((effectivePainted / effectiveRequired) * 100)
            : 0;
        } else {
          // Standard calculation (exclude wrong colors)
          needsCrosshair = realColorStats[colorKey].required - paintedForColor;
          percentage = realColorStats[colorKey].required > 0
            ? Math.round((paintedForColor / realColorStats[colorKey].required) * 100)
            : 0;
        }
      } else {
        // Fall back to proportional estimation for colors without real data
        const proportionOfTemplate = totalRequired > 0 ? colorCount / totalRequired : 0;
        paintedForColor = Math.round(totalPainted * proportionOfTemplate);
        wrongForColor = Math.round(totalWrong * proportionOfTemplate);

        if (includeWrong) {
          const effectivePainted = paintedForColor + wrongForColor;
          const effectiveRequired = colorCount;
          needsCrosshair = effectiveRequired - effectivePainted;
          percentage = effectiveRequired > 0
            ? Math.round((effectivePainted / effectiveRequired) * 100)
            : 0;
        } else {
          needsCrosshair = colorCount - paintedForColor;
          percentage = colorCount > 0
            ? Math.round((paintedForColor / colorCount) * 100)
            : 0;
        }
      }

      // Apply wrong color logic for effective painted count
      const effectivePainted = includeWrong
        ? paintedForColor + wrongForColor
        : paintedForColor;

      const totalRequiredForColor = realColorStats[colorKey]
        ? realColorStats[colorKey].required
        : colorCount;

      const correctedPercentage = totalRequiredForColor > 0
        ? Math.round((effectivePainted / totalRequiredForColor) * 100)
        : 0;

      colorStats[colorKey] = {
        totalRequired: totalRequiredForColor,
        painted: effectivePainted,
        wrong: wrongForColor,
        needsCrosshair: Math.max(0, needsCrosshair),
        percentage: correctedPercentage,
        remaining: Math.max(0, needsCrosshair)
      };
    }

    return colorStats;
  }

  /**
   * Calculate overall progress statistics
   * @param {Object} template - Template instance
   * @param {boolean} onlyEnabledTemplates - Only include enabled templates
   * @returns {Object} Overall stats {totalPainted, totalRequired, totalWrong, percentage, remaining}
   */
  function calculateOverallStats(template, onlyEnabledTemplates = true) {
    const colorStats = calculateColorStats(template, onlyEnabledTemplates);

    let totalPainted = 0;
    let totalRequired = 0;
    let totalWrong = 0;

    for (const stats of Object.values(colorStats)) {
      totalPainted += stats.painted || 0;
      totalRequired += stats.totalRequired || 0;
      totalWrong += stats.wrong || 0;
    }

    const percentage = totalRequired > 0
      ? Math.round((totalPainted / totalRequired) * 100)
      : 0;

    const remaining = Math.max(0, totalRequired - totalPainted);

    return {
      totalPainted,
      totalRequired,
      totalWrong,
      percentage,
      remaining
    };
  }

  /**
   * Get fallback statistics when no tile progress data available
   * @param {Object} template - Template instance
   * @returns {Object} Fallback color stats (all 0%)
   */
  function getFallbackStats(template) {
    const colorStats = {};

    if (template.colorPalette) {
      for (const [colorKey, paletteInfo] of Object.entries(template.colorPalette)) {
        colorStats[colorKey] = {
          totalRequired: paletteInfo.count || 0,
          painted: 0,
          wrong: 0,
          needsCrosshair: paletteInfo.count || 0,
          percentage: 0,
          remaining: paletteInfo.count || 0
        };
      }
    }

    return colorStats;
  }

  /**
   * Get progress for all enabled templates (aggregated)
   * @returns {Object} Aggregated stats
   */
  const aggregatedProgress = computed(() => {
    const enabledTemplates = templateStore.templates.filter(t => t.enabled);

    if (enabledTemplates.length === 0) {
      return {
        totalPainted: 0,
        totalRequired: 0,
        totalWrong: 0,
        percentage: 0,
        remaining: 0
      };
    }

    let totalPainted = 0;
    let totalRequired = 0;
    let totalWrong = 0;

    for (const template of enabledTemplates) {
      const stats = calculateOverallStats(template, true);
      totalPainted += stats.totalPainted;
      totalRequired += stats.totalRequired;
      totalWrong += stats.totalWrong;
    }

    const percentage = totalRequired > 0
      ? Math.round((totalPainted / totalRequired) * 100)
      : 0;

    const remaining = Math.max(0, totalRequired - totalPainted);

    return {
      totalPainted,
      totalRequired,
      totalWrong,
      percentage,
      remaining,
      templateCount: enabledTemplates.length
    };
  });

  /**
   * Get progress for a specific template
   * @param {number} templateIndex - Template index
   * @returns {Object} Template stats
   */
  function getTemplateProgress(templateIndex) {
    const template = templateStore.templates[templateIndex];
    if (!template) return null;

    return {
      overall: calculateOverallStats(template, false),
      byColor: calculateColorStats(template, false),
      template: template
    };
  }

  /**
   * Get top colors needing work (sorted by remaining pixels)
   * @param {Object} template - Template instance
   * @param {number} limit - Max number of colors to return
   * @returns {Array} Top colors [{colorKey, stats}]
   */
  function getTopColorsNeedingWork(template, limit = 5) {
    const colorStats = calculateColorStats(template, true);

    return Object.entries(colorStats)
      .map(([colorKey, stats]) => ({ colorKey, ...stats }))
      .filter(color => color.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, limit);
  }

  /**
   * Get colors sorted by completion percentage
   * @param {Object} template - Template instance
   * @returns {Array} Colors sorted by percentage [{colorKey, stats}]
   */
  function getColorsByCompletion(template) {
    const colorStats = calculateColorStats(template, true);

    return Object.entries(colorStats)
      .map(([colorKey, stats]) => ({ colorKey, ...stats }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Format number with locale separators
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  function formatNumber(num) {
    return num.toLocaleString();
  }

  /**
   * Format progress percentage
   * @param {number} painted - Painted pixels
   * @param {number} required - Required pixels
   * @returns {string} Formatted percentage (e.g., "75.5%")
   */
  function formatPercentage(painted, required) {
    if (required === 0) return '0%';
    return ((painted / required) * 100).toFixed(1) + '%';
  }

  return {
    // Calculation functions
    calculateColorStats,
    calculateOverallStats,
    getTemplateProgress,

    // Computed stats
    aggregatedProgress,

    // Helper functions
    getTopColorsNeedingWork,
    getColorsByCompletion,
    formatNumber,
    formatPercentage
  };
}
