import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Input, Tooltip } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { copyText } from '../lib/clipboard'

interface Props {
  value: string
  placeholder?: string
  rows?: number
  readOnly?: boolean
  onChange?: (value: string) => void
  mono?: boolean
}

export default function CopyableField({ value, placeholder, rows = 3, readOnly = true, onChange, mono = true }: Props) {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [hovered, setHovered] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    const ok = await copyText(value)
    if (ok) message.success(t('msg.copied'))
    else message.error(t('msg.copyFailed'))
  }

  return (
    <div className="copyable-field" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Input.TextArea
        value={value}
        placeholder={placeholder}
        autoSize={readOnly ? { minRows: rows, maxRows: rows } : { minRows: rows, maxRows: 8 }}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onClick={readOnly ? handleCopy : undefined}
        className={mono ? 'mono-input' : ''}
      />
      {readOnly && hovered && value && (
        <Tooltip title={t('msg.copied')}>
          <span className="copyable-field__badge">
            <CopyOutlined />
          </span>
        </Tooltip>
      )}
    </div>
  )
}
