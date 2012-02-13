module JSE
	class Observable
		attr_accessor :observable, :value, :definition, :lastupdated, :sid
		
		def self.queryAll(sessionid)
			memArray = Array.new
			res = $dbh.query("SELECT sid,observable FROM jse_observables WHERE sid = '#{sessionid}';")
			row = res.fetch_row
			while row
				cex = JSE::Observable.new(sessionid,row[1])
				#cex.position = row[1]
				memArray.push(cex)
				row = res.fetch_row
			end
			res.free
			return memArray
		end
		
		def self.queryUpdated(sessionid, timestamp)
			memArray = Array.new
			res = $dbh.query("SELECT sid,observable FROM jse_observables WHERE sid = '#{sessionid}' AND updated > '#{timestamp}';")
			row = res.fetch_row
			while row
				cex = JSE::Observable.new(sessionid,row[1])
				#cex.position = row[1]
				memArray.push(cex)
				row = res.fetch_row
			end
			res.free
			return memArray
		end

		def self.updateV(sessionid, name, value)
			if (sessionid != 0)
				sth = $dbh.prepare("INSERT INTO jse_observables (observable,sid,definition,value,updated) VALUES (?,?,NULL,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE value = ?;")
				sth.execute(name,sessionid,value,value);
			end
		end

		def self.updateD(sessionid, name, definition)
			if (sessionid != 0)
				sth = $dbh.prepare("INSERT INTO jse_observables (observable,sid,definition,value,updated) VALUES (?,?,?,NULL,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE definition = ?;")
				sth.execute(name,sessionid,definition,definition);
			end
		end
		
		def initialize(sessionid=0,name="")
			res = $dbh.query("SELECT observable,value,definition,updated FROM jse_observables WHERE jse_observables.observable = '#{name}' AND jse_observables.sid = '#{sessionid}';")
			row = res.fetch_row
			if row
				@sid = sessionid
				@observable = name
				@value = row[1]
				@definition = row[2]
				@lastupdated = row[3]
			end
			res.free
		end
	end
end
