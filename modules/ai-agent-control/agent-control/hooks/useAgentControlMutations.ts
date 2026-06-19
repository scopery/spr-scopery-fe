'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import * as agentControlApi from '../api/agent-control.api'

export function useAgentControlMutations(orgId: string, onSuccess: () => void) {
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [showPolicyForm, setShowPolicyForm] = useState(false)
  const [agentKey, setAgentKey] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentPurpose, setAgentPurpose] = useState('')
  const [policyKey, setPolicyKey] = useState('')
  const [policyName, setPolicyName] = useState('')
  const [policyProvider, setPolicyProvider] = useState('openai')
  const [policyModel, setPolicyModel] = useState('gpt-4o-mini')
  const [policyMode, setPolicyMode] = useState('balanced')
  const [saving, setSaving] = useState(false)
  const [applyingPreset, setApplyingPreset] = useState(false)

  const handleCreateAgent = async () => {
    if (!agentKey.trim() || !agentName.trim() || !agentPurpose.trim()) {
      toast.error('Agent key, name, and purpose are required')
      return
    }
    setSaving(true)
    try {
      await agentControlApi.createOrgAgent(orgId, {
        agent_key: agentKey.trim(),
        name: agentName.trim(),
        purpose: agentPurpose.trim(),
        status: 'inactive',
      })
      toast.success('Agent created (inactive)')
      setShowAgentForm(false)
      setAgentKey('')
      setAgentName('')
      setAgentPurpose('')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create agent')
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePolicy = async () => {
    if (!policyKey.trim() || !policyName.trim()) {
      toast.error('Policy key and name are required')
      return
    }
    setSaving(true)
    try {
      await agentControlApi.createOrgModelPolicy(orgId, {
        policy_key: policyKey.trim(),
        name: policyName.trim(),
        provider: policyProvider,
        model_name: policyModel.trim(),
        mode: policyMode,
        status: 'inactive',
      })
      toast.success('Model policy created (inactive)')
      setShowPolicyForm(false)
      setPolicyKey('')
      setPolicyName('')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create model policy')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyPreset = async (presetKey: string) => {
    setApplyingPreset(true)
    try {
      await agentControlApi.applyAgentControlPreset(orgId, {
        preset_key: presetKey,
        activate: false,
      })
      toast.success('Preset applied as inactive configuration')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to apply preset')
    } finally {
      setApplyingPreset(false)
    }
  }

  const archiveAgent = async (agentId: string) => {
    try {
      await agentControlApi.archiveOrgAgent(orgId, agentId)
      toast.success('Agent archived')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to archive agent')
    }
  }

  const archivePolicy = async (policyId: string) => {
    try {
      await agentControlApi.archiveOrgModelPolicy(orgId, policyId)
      toast.success('Model policy archived')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to archive policy')
    }
  }

  return {
    showAgentForm,
    showPolicyForm,
    agentKey,
    agentName,
    agentPurpose,
    policyKey,
    policyName,
    policyProvider,
    policyModel,
    policyMode,
    saving,
    applyingPreset,
    setShowAgentForm,
    setShowPolicyForm,
    setAgentKey,
    setAgentName,
    setAgentPurpose,
    setPolicyKey,
    setPolicyName,
    setPolicyProvider,
    setPolicyModel,
    setPolicyMode,
    handleCreateAgent,
    handleCreatePolicy,
    handleApplyPreset,
    archiveAgent,
    archivePolicy,
  }
}
