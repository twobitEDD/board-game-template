/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

export function TestSimple() {
  return (
    <div css={simpleStyle}>
      <h1>Simple Test</h1>
      <p>If this renders, the CSS parser is working</p>
    </div>
  )
}

const simpleStyle = css`
  padding: 20px;
  background: red;
  color: white;
` 