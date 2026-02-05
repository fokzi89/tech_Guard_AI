export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            audit_logs: {
                Row: {
                    id: string
                    actor_id: string
                    action: string
                    target_resource: string | null
                    details: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    actor_id: string
                    action: string
                    target_resource?: string | null
                    details?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    actor_id?: string
                    action?: string
                    target_resource?: string | null
                    details?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
            }
            conversation_messages: {
                Row: {
                    id: string
                    incident_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    photo_url: string | null
                    is_safety_warning: boolean | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    incident_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    photo_url?: string | null
                    is_safety_warning?: boolean | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    incident_id?: string
                    role?: 'user' | 'assistant' | 'system'
                    content?: string
                    photo_url?: string | null
                    is_safety_warning?: boolean | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
            incidents: {
                Row: {
                    id: string
                    org_id: string
                    user_id: string
                    machine_model: string
                    external_ticket_id: string | null
                    status: 'open' | 'resolved' | 'abandoned' | null
                    safety_interventions: Json | null
                    created_at: string
                    updated_at: string
                    resolved_at: string | null
                }
                Insert: {
                    id?: string
                    org_id: string
                    user_id: string
                    machine_model: string
                    external_ticket_id?: string | null
                    status?: 'open' | 'resolved' | 'abandoned' | null
                    safety_interventions?: Json | null
                    created_at?: string
                    updated_at?: string
                    resolved_at?: string | null
                }
                Update: {
                    id?: string
                    org_id?: string
                    user_id?: string
                    machine_model?: string
                    external_ticket_id?: string | null
                    status?: 'open' | 'resolved' | 'abandoned' | null
                    safety_interventions?: Json | null
                    created_at?: string
                    updated_at?: string
                    resolved_at?: string | null
                }
            }
            manuals: {
                Row: {
                    id: string
                    org_id: string | null
                    title: string
                    machine_model: string
                    content: string
                    embedding: string
                    safety_warnings: Json | null
                    file_url: string | null
                    status: 'active' | 'archived' | null
                    version: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_id?: string | null
                    title: string
                    machine_model: string
                    content: string
                    embedding: string
                    safety_warnings?: Json | null
                    file_url?: string | null
                    status?: 'active' | 'archived' | null
                    version?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string | null
                    title?: string
                    machine_model?: string
                    content?: string
                    embedding?: string
                    safety_warnings?: Json | null
                    file_url?: string | null
                    status?: 'active' | 'archived' | null
                    version?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    status: 'active' | 'suspended'
                    subscription_tier: 'basic' | 'professional' | 'enterprise' | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    status?: 'active' | 'suspended'
                    subscription_tier?: 'basic' | 'professional' | 'enterprise' | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    status?: 'active' | 'suspended'
                    subscription_tier?: 'basic' | 'professional' | 'enterprise' | null
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    org_id: string | null
                    role: 'super_admin' | 'org_admin' | 'technician'
                    full_name: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    org_id?: string | null
                    role: 'super_admin' | 'org_admin' | 'technician'
                    full_name: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string | null
                    role?: 'super_admin' | 'org_admin' | 'technician'
                    full_name?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            safety_blacklist: {
                Row: {
                    id: string
                    manual_id: string | null
                    machine_model: string
                    rule_description: string
                    embedding: string
                    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    manual_id?: string | null
                    machine_model: string
                    rule_description: string
                    embedding: string
                    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    manual_id?: string | null
                    machine_model?: string
                    rule_description?: string
                    embedding?: string
                    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | null
                    created_at?: string
                }
            }
            service_reports: {
                Row: {
                    id: string
                    incident_id: string
                    work_order: string | null
                    as_found: string
                    work_performed: string
                    as_left: string
                    generated_at: string | null
                }
                Insert: {
                    id?: string
                    incident_id: string
                    work_order?: string | null
                    as_found: string
                    work_performed: string
                    as_left: string
                    generated_at?: string | null
                }
                Update: {
                    id?: string
                    incident_id?: string
                    work_order?: string | null
                    as_found?: string
                    work_performed?: string
                    as_left?: string
                    generated_at?: string | null
                }
            }
            visitor: {
                Row: {
                    id: number
                    created_at: string
                    full_name: string
                    email: string
                    org_name: string
                    phone: string | null
                    is_active: boolean | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    full_name: string
                    email: string
                    org_name: string
                    phone?: string | null
                    is_active?: boolean | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    full_name?: string
                    email?: string
                    org_name?: string
                    phone?: string | null
                    is_active?: boolean | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            check_safety_blacklist: {
                Args: {
                    query_embedding: number[]
                    user_input: string
                    machine_model: string
                }
                Returns: {
                    matched: boolean
                    rule_id: string
                    rule_description: string
                    severity: string
                    similarity: number
                }[]
            }
            search_manuals: {
                Args: {
                    query_embedding: number[]
                    search_org_id: string | null
                    limit_count: number
                }
                Returns: {
                    manual_id: string
                    title: string
                    machine_model: string
                    content: string
                    safety_warnings: Json | null
                    version: string | null
                    similarity: number
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
