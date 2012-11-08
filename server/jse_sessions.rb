module JSE
	class Session
		attr_accessor :id, :title, :created, :cid

		def self.queryAll()
			memArray = Array.new
			res = $dbh.query("SELECT id FROM jse_sessions;")
			row = res.fetch_row
			while row
				cex = JSE::Session.new(row[0])
				#cex.position = row[1]
				memArray.push(cex)
				row = res.fetch_row
			end
			res.free
			return memArray
		end

		def initialize(sessid=-1)
			if (sessid != -1)
				res = $dbh.query("SELECT title,created,cid FROM jse_sessions WHERE jse_sessions.id = '#{sessid}';")
				row = res.fetch_row
				if row
					@id = sessid
					@title = row[0]
					@created = row[1]
					@cid = row[2]
				end
				res.free
			end
		end

		def save

		end
	end

		

	class Observable
		attr_accessor :observable, :value, :definition, :lastupdated, :sid
		
		def self.queryAll(cid)
			memArray = Array.new
			res = $dbh.query("SELECT sid,observable FROM jse_observables WHERE sid = '#{cid}';")
			row = res.fetch_row
			while row
				cex = JSE::Observable.new(cid,row[1])
				#cex.position = row[1]
				memArray.push(cex)
				row = res.fetch_row
			end
			res.free
			return memArray
		end
		
		def self.queryUpdated(cid, timestamp)
			memArray = Array.new
			res = $dbh.query("SELECT sid,observable FROM jse_observables WHERE sid = '#{cid}' AND updated >= '#{timestamp}';")
			row = res.fetch_row
			while row
				cex = JSE::Observable.new(cid,row[1])
				#cex.position = row[1]
				memArray.push(cex)
				row = res.fetch_row
			end
			res.free
			return memArray
		end

		def self.updateV(cid, name, value)
			if (cid != 0)
				sth = $dbh.prepare("INSERT INTO jse_observables (observable,sid,definition,value,updated) VALUES (?,?,NULL,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE value = ?;")
				sth.execute(name,cid,value,value);
			end
		end

		def self.updateD(cid, name, definition)
			if (cid != 0)
				sth = $dbh.prepare("INSERT INTO jse_observables (observable,sid,definition,value,updated) VALUES (?,?,?,NULL,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE definition = ?;")
				sth.execute(name,cid,definition,definition);
			end
		end
		
		def initialize(cid=0,name="")
			res = $dbh.query("SELECT observable,value,definition,updated FROM jse_observables WHERE jse_observables.observable = '#{name}' AND jse_observables.sid = '#{cid}';")
			row = res.fetch_row
			if row
				@sid = cid
				@observable = name
				@value = row[1]
				@definition = row[2]
				@lastupdated = row[3]
			end
			res.free
		end
	end
end
