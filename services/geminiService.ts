
import { GoogleGenAI, Type } from "@google/genai";
import { Strategy, IndicatorName, Operator, AmountUnit, IndicatorSource, PositionSide, OrderType, PyramidingStrategy, AssetType, OptionContractType, OptionMoneyness } from '../types';
import { AVAILABLE_DATA_SOURCES, AVAILABLE_MARKETS, AVAILABLE_TIMEFRAMES } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const indicatorParamsSchema = {
  type: Type.OBJECT,
  properties: {
    source: { type: Type.STRING, enum: Object.values(IndicatorSource), description: "The candle property to use for calculation, e.g., 'Close'." },
    period: { type: Type.INTEGER, description: "The lookback period. For PRICE, period > 1 on High/Low means highest/lowest over N periods. On Close/Open it means value N periods ago." },
    fast: { type: Type.INTEGER, description: "The fast period for MACD." },
    slow: { type: Type.INTEGER, description: "The slow period for MACD." },
    signal: { type: Type.INTEGER, description: "The signal period for MACD." },
  },
  description: "Parameters for the indicator. Only include relevant parameters. E.g., for SMA use {'period': 20, 'source': 'Close'}."
};

const conditionSchema = {
    type: Type.OBJECT,
    properties: {
        indicator1: { type: Type.STRING, enum: Object.values(IndicatorName), description: "The primary indicator for comparison." },
        indicator1Params: indicatorParamsSchema,
        operator: { type: Type.STRING, enum: Object.values(Operator), description: "The comparison operator." },
        indicator2: {
        oneOf: [{ type: Type.STRING, enum: Object.values(IndicatorName) }, { type: Type.NUMBER }],
        description: "The secondary indicator or a fixed numeric value for comparison."
        },
        indicator2Params: indicatorParamsSchema,
    },
    required: ["indicator1", "indicator1Params", "operator", "indicator2"],
};

const conditionGroupSchema = {
    type: Type.OBJECT,
    properties: {
        conditions: {
            type: Type.ARRAY,
            description: "A list of conditions that must ALL be true (AND logic).",
            items: conditionSchema,
        }
    },
    required: ["conditions"],
}

const orderSettingsSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: Object.values(OrderType), description: "The type of order to place for entry." },
        limitPrice: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                value: { type: Type.NUMBER, description: "The value for the limit price offset." },
                unit: { type: Type.STRING, enum: ['PERCENT', 'PRICE_OFFSET'], description: "The unit for the limit price offset from the entry signal price." }
            },
            description: "Configuration for LIMIT orders. E.g., enter at 1% below the crossover price."
        }
    },
    required: ["type"],
};

const pyramidingSchema = {
    type: Type.OBJECT,
    nullable: true,
    properties: {
        maxEntries: { type: Type.INTEGER, description: "Maximum number of times to add to the position after the initial entry." },
        strategy: { type: Type.STRING, enum: Object.values(PyramidingStrategy), description: "The style of pyramiding. COMPOUNDING_UP (add to winners), AVERAGING_DOWN (add to losers)." },
        conditions: {
            type: Type.ARRAY,
            description: "A list of condition groups. Add to the position if ANY group is true (OR logic).",
            items: conditionGroupSchema,
        }
    },
    required: ["maxEntries", "strategy", "conditions"],
};


const strategySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative and descriptive name for the strategy." },
    description: { type: Type.STRING, description: "A brief, one-sentence explanation of the strategy logic." },
    market: { type: Type.STRING, enum: AVAILABLE_MARKETS, description: "The trading pair for the strategy." },
    timeframe: { type: Type.STRING, enum: AVAILABLE_TIMEFRAMES, description: "The chart timeframe for the strategy." },
    dataSource: { type: Type.STRING, enum: AVAILABLE_DATA_SOURCES, description: "The data source for market data." },
    assetType: { type: Type.STRING, enum: Object.values(AssetType), description: "The type of asset to trade: SPOT (the underlying asset) or OPTIONS." },
    optionParams: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
            contractType: { type: Type.STRING, enum: Object.values(OptionContractType), description: "The type of option contract, CALL or PUT." },
            moneyness: { type: Type.STRING, enum: Object.values(OptionMoneyness), description: "The moneyness of the option (ITM, ATM, OTM)." },
            expirationDays: { type: Type.INTEGER, description: "The number of days until the option contract expires." }
        },
        description: "Parameters required only for OPTIONS asset type."
    },
    side: { type: Type.STRING, enum: Object.values(PositionSide), description: "The position side: LONG for buying, SHORT for selling." },
    positionSizing: {
        type: Type.OBJECT,
        properties: {
            amount: { type: Type.INTEGER, description: "The amount of portfolio to use." },
            unit: { type: Type.STRING, enum: [AmountUnit.PERCENT], description: "The unit for the amount (must be PERCENT)." }
        },
        required: ["amount", "unit"],
    },
    orderSettings: orderSettingsSchema,
    entryConditions: {
        type: Type.ARRAY,
        description: "A list of condition groups. The entry triggers if ANY group is true (OR logic).",
        items: conditionGroupSchema,
    },
    exitConditions: {
        type: Type.ARRAY,
        description: "A list of condition groups for exiting a trade. The exit triggers if ANY group is true (OR logic).",
        items: conditionGroupSchema,
    },
    pyramiding: pyramidingSchema,
    stopLoss: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
            value: { type: Type.NUMBER, description: "The value for the stop loss." },
            unit: { type: Type.STRING, enum: ['PERCENT', 'PRICE_OFFSET'], description: "The unit for the stop loss value." },
            trailing: { type: Type.BOOLEAN, description: "Whether the stop loss should trail the price." }
        }
    },
    takeProfit: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
            value: { type: Type.NUMBER, description: "The value for the take profit." },
            unit: { type: Type.STRING, enum: ['PERCENT', 'PRICE_OFFSET'], description: "The unit for the take profit value." }
        }
    }
  },
  required: ["name", "description", "market", "timeframe", "dataSource", "assetType", "side", "positionSizing", "orderSettings", "entryConditions", "exitConditions"],
};


export const generateStrategyFromPrompt = async (prompt: string): Promise<Partial<Strategy>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert trading strategy assistant. Based on the user's request, create a complete trading strategy configuration. The user wants: "${prompt}".
      
      - Your response MUST be a valid JSON object that conforms to the provided schema.
      - If the user mentions "options", "calls", "puts", "covered call", "protective put", etc., set 'assetType' to OPTIONS and provide the 'optionParams'. Otherwise, set 'assetType' to SPOT.
      - For OPTIONS strategies, infer the contractType, moneyness, and a reasonable expirationDays from the prompt. A 'buy' or 'long' on a call/put means a LONG position. A 'sell' or 'short' on a call/put means a SHORT position (e.g., selling a covered call).
      - For all conditions, define complete parameters for each indicator, including candle 'source' and 'period'.
      - For the PRICE indicator, a period of 1 means the current price. A period > 1 for High/Low source means the highest high or lowest low over that period. For Close/Open it means the value N candles ago.
      - Create at least one entry condition group. If the user describes exit logic, create at least one exit condition group. Otherwise, provide an empty array for exitConditions.
      - Set position sizing to 100% of the portfolio.
      - Set the 'dataSource' to the most appropriate one, default to 'Binance' if unsure.
      - Default to a MARKET order unless a LIMIT order is specified.
      - If the user mentions adding to a position, averaging down, or compounding, configure the 'pyramiding' object with appropriate conditions.
      - If the prompt implies risk management (e.g., "get out if it drops 2%"), set a 'stopLoss'. If they mention a "trailing stop", set the 'trailing' flag to true.
      - Be creative with the strategy name and provide a clear description.
      - For SPOT strategies: a 'buy' or 'long' prompt implies side: LONG. A 'sell' or 'short' prompt implies side: SHORT.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: strategySchema,
      },
    });

    const jsonString = response.text.trim();
    const generatedConfig = JSON.parse(jsonString);
    
    // Add unique IDs to groups and conditions
    const addIds = (groups: any[]) => {
        if (groups && Array.isArray(groups)) {
            return groups.map((g: any) => ({
                ...g,
                id: `group-${Date.now()}-${Math.random()}`,
                conditions: g.conditions?.map((c: any) => ({
                    ...c,
                    id: `cond-${Date.now()}-${Math.random()}`
                })) || []
            }));
        }
        return [];
    }
    
    generatedConfig.entryConditions = addIds(generatedConfig.entryConditions);
    generatedConfig.exitConditions = addIds(generatedConfig.exitConditions);
    if(generatedConfig.pyramiding) {
        generatedConfig.pyramiding.conditions = addIds(generatedConfig.pyramiding.conditions);
    }


    return generatedConfig as Partial<Strategy>;

  } catch (error) {
    console.error("Error generating strategy from prompt:", error);
    throw new Error("Failed to generate strategy. The AI model might be unavailable or the request was invalid.");
  }
};
