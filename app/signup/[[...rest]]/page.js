"use client"
import { SignUp } from "@clerk/nextjs"

import React from 'react'

const SignUpPage = () => {
  return (
    <div className="flex justify-center items-center"><SignUp forceRedirectUrl="/health-assessment" fallbackRedirectUrl="/health-assessment"/></div>
  )
}

export default SignUpPage