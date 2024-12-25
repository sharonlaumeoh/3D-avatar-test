<template>
  <div class="min-h-screen bg-gray-100 flex justify-center items-center p-6">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Account Activation</h2>
      
      <!-- Company Search -->
      <div class="mb-6 relative">
        <label class="block text-gray-700 text-sm font-bold mb-2">Company</label>
        <input
          type="text"
          v-model="companySearch"
          @input="searchCompanies"
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Start typing company name..."
        />
        <!-- Dropdown -->
        <div v-if="showDropdown && filteredCompanies.length > 0" 
             class="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div
            v-for="company in filteredCompanies"
            :key="company.id"
            @click="selectCompany(company)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {{ company.name }}
          </div>
        </div>
      </div>

      <!-- Position -->
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2">Position</label>
        <input
          type="text"
          v-model="position"
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Your position at the company"
        />
      </div>

      <!-- Activation Token -->
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2">Activation Token</label>
        <input
          type="text"
          v-model="activationToken"
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter your activation token"
        />
      </div>

      <button
        @click="activate"
        :disabled="isLoading"
        class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200"
      >
        {{ isLoading ? 'Activating...' : 'Activate Account' }}
      </button>

      <!-- Error/Success Messages -->
      <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
        {{ error }}
      </div>
      <div v-if="success" class="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
        {{ success }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'

export default {
  setup() {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_KEY
    )
    
    const router = useRouter()
    const { getAccessTokenSilently, user } = useAuth0()

    const companySearch = ref('')
    const position = ref('')
    const activationToken = ref('')
    const error = ref('')
    const success = ref('')
    const isLoading = ref(false)
    const showDropdown = ref(false)
    const filteredCompanies = ref([])
    const selectedCompany = ref(null)

    const searchCompanies = async () => {
      if (companySearch.value.length < 2) {
        filteredCompanies.value = []
        showDropdown.value = false
        return
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .ilike('name', `${companySearch.value}%`)
          .limit(5)

        if (error) throw error
        
        filteredCompanies.value = data
        showDropdown.value = true
      } catch (err) {
        console.error('Error searching companies:', err)
        error.value = 'Failed to search companies'
      }
    }

    const selectCompany = (company) => {
      selectedCompany.value = company
      companySearch.value = company.name
      showDropdown.value = false
    }

    const activate = async () => {
      if (!selectedCompany.value || !position.value || !activationToken.value) {
        error.value = 'Please fill in all fields'
        return
      }

      isLoading.value = true
      error.value = ''

      try {
        const token = await getAccessTokenSilently()
        
        const { data, error: activationError } = await supabase
          .from('user_activations')
          .insert([
            {
              user_id: user.value.sub,
              company_id: selectedCompany.value.id,
              position: position.value,
              activation_token: activationToken.value,
              email: user.value.email
            }
          ])
          .select()
          .single()

        if (activationError) throw activationError

        success.value = 'Account activated successfully!'
        setTimeout(() => {
          router.push('/home')
        }, 1500)
      } catch (err) {
        console.error('Activation error:', err)
        error.value = 'Invalid activation token or company information'
      } finally {
        isLoading.value = false
      }
    }

    return {
      companySearch,
      position,
      activationToken,
      error,
      success,
      isLoading,
      showDropdown,
      filteredCompanies,
      searchCompanies,
      selectCompany,
      activate
    }
  }
}
</script>
