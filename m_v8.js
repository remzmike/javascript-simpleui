// webpack cannot pack this because it contains natives syntax
// the webpack parser (acorn) does not support natives syntax (eg. %IsSmi)
//
// i think it was the natives calls crashing the tab, not browser es modules, ainf

const m_v8_enabled = false;

const m_v8 = {
	IsSmi: (x) => {
		if (!m_v8_enabled) return true;

        if (x != null && x != undefined && typeof(x) == 'number') { // idk, maybe prevents crashes
			//return %IsSmi(x);			
		} else {
			return false;
		}
	},	
	IsValidSmi: (x) => {
		if (!m_v8_enabled) return true;

        if (x != null && x != undefined && typeof(x) == 'number') { // idk, maybe prevents crashes
			//return %IsValidSmi(x);			
		} else {
			return false;
		}
	},
	//
	assert_smi: (x) => {
		if (!m_v8_enabled) return true;

        console.assert(m_v8.IsSmi(x));
		console.assert(m_v8.IsValidSmi(x));
	}
};

