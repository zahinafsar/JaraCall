import React from 'react'
import './style.css'

export default function Button({title, id}) {
    return <button idName={id}>{title}</button>
}
