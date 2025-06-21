/** @jsxImportSource @emotion/react */
import { RuleId } from '../../../rules/src/rules/RuleId'
import { ComponentType } from 'react'
import { PlayTileHeader } from './PlayTileHeader'
import { DrawTileHeader } from './DrawTileHeader'

export const Headers: Partial<Record<RuleId, ComponentType>> = {
  [RuleId.PlayTile]: PlayTileHeader,
  [RuleId.DrawTile]: DrawTileHeader
}
